using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERPSystem.Data;
using ERPSystem.Models;
using System.Security.Claims;

namespace ERPSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "Purchase")]
    public class CanvassingController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<CanvassingController> _logger;

        public CanvassingController(AppDbContext db, ILogger<CanvassingController> logger)
        {
            _db = db;
            _logger = logger;
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

        // POST: api/Canvassing
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Canvassing canvassing)
        {
            if (!ModelState.IsValid)
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
                canvassing.CompanyId = 1; // TODO: Get from user context

                _db.Canvassings.Add(canvassing);
                await _db.SaveChangesAsync();

                _logger.LogInformation("Canvassing {CanvassingNumber} created by user {UserId}",
                    canvassing.CanvassingNumber, userId);

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
                var canvassing = await _db.Canvassings
                    .Include(c => c.Items.Where(i => i.IsSelected))
                        .ThenInclude(i => i.Product)
                    .Include(c => c.PurchaseRequest)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (canvassing == null)
                    return NotFound(new { message = "Canvassing not found" });

                if (canvassing.Status != "Completed")
                    return BadRequest(new { message = "Canvassing must be completed first" });

                if (canvassing.SelectedSupplierId == null)
                    return BadRequest(new { message = "No supplier selected" });

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                // Create Purchase Order
                var po = new PurchaseOrder
                {
                    CompanyId = canvassing.CompanyId,
                    PONumber = await GeneratePONumber(),
                    PurchaseRequestId = canvassing.PurchaseRequestId,
                    CanvassingId = canvassing.Id,
                    SupplierId = canvassing.SelectedSupplierId.Value,
                    OrderDate = DateTime.UtcNow,
                    RequiredDate = canvassing.PurchaseRequest?.RequiredDate,
                    Status = "Draft",
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = userId
                };

                // Add PO items from selected canvassing items
                decimal subTotal = 0;
                foreach (var canvItem in canvassing.Items.Where(i => i.IsSelected))
                {
                    var poItem = new PurchaseOrderItem
                    {
                        ProductId = canvItem.ProductId!.Value,
                        Quantity = canvItem.Quantity,
                        UnitPrice = canvItem.UnitPrice,
                        LineTotal = canvItem.TotalPrice
                    };
                    po.Items.Add(poItem);
                    subTotal += canvItem.TotalPrice;
                }

                po.SubTotal = subTotal;
                po.TotalAmount = subTotal; // TODO: Add tax calculation

                _db.PurchaseOrders.Add(po);

                // Update PR status
                if (canvassing.PurchaseRequest != null)
                {
                    canvassing.PurchaseRequest.Status = "Converted";
                }

                await _db.SaveChangesAsync();

                _logger.LogInformation("Canvassing {Id} converted to PO {PONumber}",
                    id, po.PONumber);

                return Ok(new { message = "Purchase order created", poId = po.Id, poNumber = po.PONumber });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error converting canvassing {Id} to PO", id);
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