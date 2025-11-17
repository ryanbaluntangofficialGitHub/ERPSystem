using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERPSystem.Data;
using ERPSystem.Models;
using System.Security.Claims;
using ERPSystem.Services;
using Microsoft.AspNetCore.Hosting;

namespace ERPSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "Purchase")]
    public class CanvassingController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<CanvassingController> _logger;
        private readonly PurchasingService _purchasingService;

        public CanvassingController(AppDbContext db, ILogger<CanvassingController> logger, PurchasingService purchasingService)
        {
            _db = db;
            _logger = logger;
            _purchasingService = purchasingService;
        }

        // GET: api/Canvassing
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var canvassings = await _db.Canvassings
                    .Include(c => c.PurchaseRequest)
                    .Include(c => c.Items)
                        .ThenInclude(i => i.Supplier)
                    .Include(c => c.Items)
                        .ThenInclude(i => i.Product)
                    .Include(c => c.SelectedSupplier)
                    .OrderByDescending(c => c.CanvassingDate)
                    .ToListAsync();

                return Ok(canvassings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching canvassings");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET: api/Canvassing/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var canvassing = await _db.Canvassings
                    .Include(c => c.PurchaseRequest)
                        .ThenInclude(pr => pr!.Items)
                    .Include(c => c.Items)
                        .ThenInclude(i => i.Supplier)
                    .Include(c => c.Items)
                        .ThenInclude(i => i.Product)
                    .Include(c => c.SelectedSupplier)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (canvassing == null)
                    return NotFound(new { message = "Canvassing not found" });

                return Ok(canvassing);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching canvassing {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        private bool ValidateCanvassingModel(Canvassing canvassing)
        {
            // Clear any existing model state errors for items
            // Validate top-level required fields
            if (canvassing == null)
            {
                ModelState.AddModelError(string.Empty, "Payload is required");
                return false;
            }

            if (canvassing.Items == null || !canvassing.Items.Any())
            {
                ModelState.AddModelError("Items", "At least one canvassing item is required");
            }
            else
            {
                for (int i = 0; i < canvassing.Items.Count; i++)
                {
                    var it = canvassing.Items.ElementAt(i);
                    if (it == null)
                    {
                        ModelState.AddModelError($"Items[{i}]", "Item is required");
                        continue;
                    }

                    if (it.SupplierId <= 0)
                        ModelState.AddModelError($"Items[{i}].SupplierId", "Supplier is required and must be a positive id");

                    if (it.Quantity <= 0)
                        ModelState.AddModelError($"Items[{i}].Quantity", "Quantity must be greater than zero");

                    if (it.UnitPrice < 0)
                        ModelState.AddModelError($"Items[{i}].UnitPrice", "Unit price must be zero or greater");

                    // Allow small rounding differences, but check consistency
                    var expectedTotal = it.Quantity * it.UnitPrice;
                    if (Math.Round(it.TotalPrice - expectedTotal, 2) != 0)
                        ModelState.AddModelError($"Items[{i}].TotalPrice", "TotalPrice must equal Quantity * UnitPrice");
                }
            }

            return ModelState.ErrorCount == 0;
        }

        // POST: api/Canvassing
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Canvassing canvassing)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Validate items and business rules
            if (!ValidateCanvassingModel(canvassing))
                return BadRequest(ModelState);

            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                // Generate Canvassing Number
                canvassing.CanvassingNumber = await GenerateCanvassingNumber();
                canvassing.CanvassingDate = DateTime.UtcNow;
                canvassing.Status = "InProgress";
                canvassing.CreatedDate = DateTime.UtcNow;
                canvassing.CreatedBy = userId;
                canvassing.CompanyId = canvassing.CompanyId > 0 ? canvassing.CompanyId : 1; // TODO: Get from user context

                // Ensure items reference is preserved and set foreign key
                if (canvassing.Items != null)
                {
                    foreach (var it in canvassing.Items)
                    {
                        it.CanvassingId = canvassing.Id; // will be set after save
                    }
                }

                _db.Canvassings.Add(canvassing);
                await _db.SaveChangesAsync();

                _logger.LogInformation("Canvassing {CanvassingNumber} created by user {UserId}",
                    canvassing.CanvassingNumber, userId);

                // Audit
                await _purchasingService.AuditAsync(userId, "Create", "Canvassing", canvassing.Id, $"Canvassing {canvassing.CanvassingNumber} created");

                return CreatedAtAction(nameof(GetById), new { id = canvassing.Id }, canvassing);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating canvassing");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // POST: api/Canvassing/5/select-supplier
        [HttpPost("{id}/select-supplier")]
        public async Task<IActionResult> SelectSupplier(int id, [FromBody] SelectSupplierRequest request)
        {
            try
            {
                var canvassing = await _db.Canvassings
                    .Include(c => c.Items)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (canvassing == null)
                    return NotFound(new { message = "Canvassing not found" });

                if (canvassing.Status != "InProgress")
                    return BadRequest(new { message = "Canvassing is not in progress" });

                // Mark selected supplier's items
                foreach (var item in canvassing.Items)
                {
                    item.IsSelected = item.SupplierId == request.SupplierId;
                }

                canvassing.SelectedSupplierId = request.SupplierId;
                canvassing.Status = "Completed";

                await _db.SaveChangesAsync();

                _logger.LogInformation("Supplier {SupplierId} selected for canvassing {Id}",
                    request.SupplierId, id);

                // Audit
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                await _purchasingService.AuditAsync(userId, "SelectSupplier", "Canvassing", id, $"Supplier {request.SupplierId} selected");

                return Ok(new { message = "Supplier selected successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error selecting supplier for canvassing {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // POST: api/Canvassing/5/convert-to-po
        [HttpPost("{id}/convert-to-po")]
        public async Task<IActionResult> ConvertToPO(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                var po = await _purchasingService.ConvertCanvassingToPOAsync(id, userId);

                // Audit
                await _purchasingService.AuditAsync(userId, "ConvertToPO", "Canvassing", id, $"Converted canvassing {id} to PO {po.PONumber}");

                return Ok(new { message = "Purchase order created", poId = po.Id, poNumber = po.PONumber });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Business rule violation converting canvassing {Id}", id);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error converting canvassing {Id} to PO", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // PUT: api/Canvassing/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Canvassing model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Validate items and business rules
            if (!ValidateCanvassingModel(model))
                return BadRequest(ModelState);

            try
            {
                var existing = await _db.Canvassings
                    .Include(c => c.Items)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (existing == null)
                    return NotFound(new { message = "Canvassing not found" });

                if (existing.Status != "InProgress")
                    return BadRequest(new { message = "Canvassing cannot be edited in current status" });

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                // Update head
                existing.PurchaseRequestId = model.PurchaseRequestId;
                existing.CanvassingDate = model.CanvassingDate != default ? model.CanvassingDate : existing.CanvassingDate;
                existing.Notes = model.Notes;
                existing.ModifiedDate = DateTime.UtcNow;
                existing.ModifiedBy = userId;

                // Replace items
                _db.CanvassingItems.RemoveRange(existing.Items);
                existing.Items = new List<CanvassingItem>();

                if (model.Items != null)
                {
                    foreach (var it in model.Items)
                    {
                        existing.Items.Add(new CanvassingItem
                        {
                            SupplierId = it.SupplierId,
                            ProductId = it.ProductId,
                            Quantity = it.Quantity,
                            UnitPrice = it.UnitPrice,
                            TotalPrice = it.TotalPrice,
                            DeliveryDays = it.DeliveryDays,
                            PaymentTerms = it.PaymentTerms,
                            Notes = it.Notes,
                            IsSelected = it.IsSelected
                        });
                    }
                }

                await _db.SaveChangesAsync();

                _logger.LogInformation("Canvassing {Id} updated by user {UserId}", id, userId);

                // Audit
                await _purchasingService.AuditAsync(userId, "Update", "Canvassing", id, $"Canvassing {existing.CanvassingNumber} updated");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating canvassing {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // Helper methods
        private async Task<string> GenerateCanvassingNumber()
        {
            var year = DateTime.UtcNow.Year;
            var month = DateTime.UtcNow.Month;
            var prefix = $"CNV{year}{month:D2}";

            var lastCanvassing = await _db.Canvassings
                .Where(c => c.CanvassingNumber.StartsWith(prefix))
                .OrderByDescending(c => c.CanvassingNumber)
                .FirstOrDefaultAsync();

            int nextNumber = 1;
            if (lastCanvassing != null)
            {
                var lastNumber = lastCanvassing.CanvassingNumber.Substring(prefix.Length);
                if (int.TryParse(lastNumber, out int num))
                {
                    nextNumber = num + 1;
                }
            }

            return $"{prefix}{nextNumber:D4}";
        }

        private async Task<string> GeneratePONumber()
        {
            var year = DateTime.UtcNow.Year;
            var month = DateTime.UtcNow.Month;
            var prefix = $"PO{year}{month:D2}";

            var lastPO = await _db.PurchaseOrders
                .Where(po => po.PONumber.StartsWith(prefix))
                .OrderByDescending(po => po.PONumber)
                .FirstOrDefaultAsync();

            int nextNumber = 1;
            if (lastPO != null)
            {
                var lastNumber = lastPO.PONumber.Substring(prefix.Length);
                if (int.TryParse(lastNumber, out int num))
                {
                    nextNumber = num + 1;
                }
            }

            return $"{prefix}{nextNumber:D4}";
        }
    }

    public class SelectSupplierRequest
    {
        public int SupplierId { get; set; }
    }
}