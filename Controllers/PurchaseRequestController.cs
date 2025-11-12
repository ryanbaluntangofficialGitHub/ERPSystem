using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERPSystem.Data;
using ERPSystem.Models;
using System.Security.Claims;
using ERPSystem.DTOs;
using ERPSystem.Services;

namespace ERPSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PurchaseRequestController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<PurchaseRequestController> _logger;
        private readonly PurchasingService _purchasingService;

        public PurchaseRequestController(AppDbContext db, ILogger<PurchaseRequestController> logger, PurchasingService purchasingService)
        {
            _db = db;
            _logger = logger;
            _purchasingService = purchasingService;
        }

        // GET: api/PurchaseRequest
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? status = null)
        {
            try
            {
                var query = _db.PurchaseRequests
                    .Include(pr => pr.Items)
                        .ThenInclude(i => i.Product)
                    .Include(pr => pr.Department)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(pr => pr.Status == status);
                }

                var requests = await query
                    .OrderByDescending(pr => pr.RequestDate)
                    .ToListAsync();

                return Ok(requests);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching purchase requests");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET: api/PurchaseRequest/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var request = await _db.PurchaseRequests
                    .Include(pr => pr.Items)
                        .ThenInclude(i => i.Product)
                    .Include(pr => pr.Department)
                    .FirstOrDefaultAsync(pr => pr.Id == id);

                if (request == null)
                    return NotFound(new { message = "Purchase request not found" });

                return Ok(request);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching purchase request {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // POST: api/PurchaseRequest
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PurchaseRequestCreateDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                var request = new PurchaseRequest
                {
                    CompanyId = model.CompanyId,
                    RequestNumber = await GeneratePRNumber(),
                    RequestDate = DateTime.UtcNow,
                    DepartmentId = model.DepartmentId,
                    Priority = model.Priority,
                    RequiredDate = model.RequiredDate,
                    Status = "Draft",
                    RequestedBy = userId,
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = userId
                };

                foreach (var item in model.Items)
                {
                    request.Items.Add(new PurchaseRequestItem
                    {
                        ProductId = item.ProductId,
                        Description = item.Description,
                        Quantity = item.Quantity,
                        EstimatedPrice = item.EstimatedPrice,
                        UnitOfMeasure = item.UnitOfMeasure,
                        Purpose = item.Purpose
                    });
                }

                _db.PurchaseRequests.Add(request);
                await _db.SaveChangesAsync();

                _logger.LogInformation("Purchase request {RequestNumber} created by user {UserId}",
                    request.RequestNumber, userId);

                return CreatedAtAction(nameof(GetById), new { id = request.Id }, request);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating purchase request");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // PUT: api/PurchaseRequest/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] PurchaseRequestCreateDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (id != model.Id)
                return BadRequest(new { message = "ID mismatch" });

            try
            {
                var existingRequest = await _db.PurchaseRequests
                    .Include(pr => pr.Items)
                    .FirstOrDefaultAsync(pr => pr.Id == id);

                if (existingRequest == null)
                    return NotFound(new { message = "Purchase request not found" });

                // Check if can be edited
                if (existingRequest.Status != "Draft" && existingRequest.Status != "Rejected")
                {
                    return BadRequest(new { message = "Cannot edit purchase request in current status" });
                }

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                // Update main fields
                existingRequest.DepartmentId = model.DepartmentId;
                existingRequest.Priority = model.Priority;
                existingRequest.RequiredDate = model.RequiredDate;
                existingRequest.Notes = model.Notes;
                existingRequest.ModifiedDate = DateTime.UtcNow;
                existingRequest.ModifiedBy = userId;

                // Update items
                _db.PurchaseRequestItems.RemoveRange(existingRequest.Items);
                existingRequest.Items = new List<PurchaseRequestItem>();
                foreach (var item in model.Items)
                {
                    existingRequest.Items.Add(new PurchaseRequestItem
                    {
                        ProductId = item.ProductId,
                        Description = item.Description,
                        Quantity = item.Quantity,
                        EstimatedPrice = item.EstimatedPrice,
                        UnitOfMeasure = item.UnitOfMeasure,
                        Purpose = item.Purpose
                    });
                }

                await _db.SaveChangesAsync();

                _logger.LogInformation("Purchase request {Id} updated by user {UserId}", id, userId);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating purchase request {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // POST: api/PurchaseRequest/5/submit
        [HttpPost("{id}/submit")]
        public async Task<IActionResult> Submit(int id)
        {
            try
            {
                var request = await _db.PurchaseRequests.FindAsync(id);

                if (request == null)
                    return NotFound(new { message = "Purchase request not found" });

                if (request.Status != "Draft")
                    return BadRequest(new { message = "Only draft requests can be submitted" });

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                request.Status = "PendingApproval";
                request.ModifiedDate = DateTime.UtcNow;
                request.ModifiedBy = userId;

                await _db.SaveChangesAsync();

                _logger.LogInformation("Purchase request {Id} submitted for approval by user {UserId}",
                    id, userId);

                return Ok(new { message = "Purchase request submitted for approval" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting purchase request {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // POST: api/PurchaseRequest/5/approve
        [HttpPost("{id}/approve")]
        [Authorize(Policy = "Purchase")]
        public async Task<IActionResult> Approve(int id, [FromBody] ApprovalRequest approval)
        {
            try
            {
                var request = await _db.PurchaseRequests.FindAsync(id);

                if (request == null)
                    return NotFound(new { message = "Purchase request not found" });

                if (request.Status != "PendingApproval")
                    return BadRequest(new { message = "Request is not pending approval" });

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                request.Status = "Approved";
                request.ApprovedBy = userId;
                request.ApprovalDate = DateTime.UtcNow;
                request.ModifiedDate = DateTime.UtcNow;
                request.ModifiedBy = userId;

                await _db.SaveChangesAsync();

                _logger.LogInformation("Purchase request {Id} approved by user {UserId}", id, userId);

                return Ok(new { message = "Purchase request approved" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving purchase request {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // POST: api/PurchaseRequest/5/reject
        [HttpPost("{id}/reject")]
        [Authorize(Policy = "Purchase")]
        public async Task<IActionResult> Reject(int id, [FromBody] ApprovalRequest approval)
        {
            try
            {
                var request = await _db.PurchaseRequests.FindAsync(id);

                if (request == null)
                    return NotFound(new { message = "Purchase request not found" });

                if (request.Status != "PendingApproval")
                    return BadRequest(new { message = "Request is not pending approval" });

                if (string.IsNullOrEmpty(approval.Reason))
                    return BadRequest(new { message = "Rejection reason is required" });

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                request.Status = "Rejected";
                request.ApprovedBy = userId;
                request.ApprovalDate = DateTime.UtcNow;
                request.RejectionReason = approval.Reason;
                request.ModifiedDate = DateTime.UtcNow;
                request.ModifiedBy = userId;

                await _db.SaveChangesAsync();

                _logger.LogInformation("Purchase request {Id} rejected by user {UserId}", id, userId);

                return Ok(new { message = "Purchase request rejected" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting purchase request {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // DELETE: api/PurchaseRequest/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var request = await _db.PurchaseRequests
                    .Include(pr => pr.Items)
                    .FirstOrDefaultAsync(pr => pr.Id == id);

                if (request == null)
                    return NotFound(new { message = "Purchase request not found" });

                if (request.Status != "Draft")
                    return BadRequest(new { message = "Only draft requests can be deleted" });

                _db.PurchaseRequests.Remove(request);
                await _db.SaveChangesAsync();

                _logger.LogInformation("Purchase request {Id} deleted", id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting purchase request {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // POST: api/PurchaseRequest/5/convert-to-po
        [HttpPost("{id}/convert-to-po")]
        [Authorize(Policy = "Purchase")]
        public async Task<IActionResult> ConvertToPO(int id, [FromBody] ConvertPRToPODto model)
        {
            try
            {
                var pr = await _db.PurchaseRequests
                    .Include(p => p.Items)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (pr == null) return NotFound(new { message = "Purchase request not found" });
                if (pr.Status != "Approved") return BadRequest(new { message = "Purchase request must be approved before converting" });

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                // Create PO
                var po = new PurchaseOrder
                {
                    CompanyId = pr.CompanyId,
                    PONumber = await _purchasingService.GeneratePONumberAsync(),
                    PurchaseRequestId = pr.Id,
                    SupplierId = model.SupplierId,
                    OrderDate = DateTime.UtcNow,
                    RequiredDate = pr.RequiredDate,
                    Status = "Draft",
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = userId
                };

                decimal subTotal = 0m;
                foreach (var item in model.Items)
                {
                    var lineTotal = item.Quantity * item.UnitPrice;
                    po.Items.Add(new PurchaseOrderItem
                    {
                        ProductId = item.ProductId ?? 0,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        LineTotal = lineTotal
                    });
                    subTotal += lineTotal;
                }

                po.SubTotal = subTotal;
                po.TotalAmount = subTotal + po.TaxAmount - po.DiscountAmount + po.ShippingAmount;

                _db.PurchaseOrders.Add(po);

                pr.Status = "Converted";
                pr.ModifiedDate = DateTime.UtcNow;
                pr.ModifiedBy = userId;

                await _db.SaveChangesAsync();

                return Ok(new { message = "Purchase request converted to PO", poId = po.Id, poNumber = po.PONumber });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error converting purchase request {Id} to PO", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // Helper method to generate PR number
        private async Task<string> GeneratePRNumber()
        {
            var year = DateTime.UtcNow.Year;
            var month = DateTime.UtcNow.Month;
            var prefix = $"PR{year}{month:D2}";

            var lastPR = await _db.PurchaseRequests
                .Where(pr => pr.RequestNumber.StartsWith(prefix))
                .OrderByDescending(pr => pr.RequestNumber)
                .FirstOrDefaultAsync();

            int nextNumber = 1;
            if (lastPR != null)
            {
                var lastNumber = lastPR.RequestNumber.Substring(prefix.Length);
                if (int.TryParse(lastNumber, out int num))
                {
                    nextNumber = num + 1;
                }
            }

            return $"{prefix}{nextNumber:D4}";
        }
    }

    public class ApprovalRequest
    {
        public string? Reason { get; set; }
        public string? Notes { get; set; }
    }

    public class ConvertPRToPODto
    {
        public int SupplierId { get; set; }
        public List<ConvertPRToPOItemDto> Items { get; set; } = new();
    }

    public class ConvertPRToPOItemDto
    {
        public int? ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
}