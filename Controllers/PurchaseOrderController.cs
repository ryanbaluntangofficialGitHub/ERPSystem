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
    [Authorize(Policy = "Purchase")]
    public class PurchaseOrderController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<PurchaseOrderController> _logger;
        private readonly PurchasingService _purchasingService;

        public PurchaseOrderController(AppDbContext db, ILogger<PurchaseOrderController> logger, PurchasingService purchasingService)
        {
            _db = db;
            _logger = logger;
            _purchasingService = purchasingService;
        }

        // GET: api/PurchaseOrder
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? status = null)
        {
            try
            {
                var query = _db.PurchaseOrders
                    .Include(po => po.Supplier)
                    .Include(po => po.Items)
                        .ThenInclude(i => i.Product)
                    .Include(po => po.PurchaseRequest)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(po => po.Status == status);
                }

                var orders = await query
                    .OrderByDescending(po => po.OrderDate)
                    .ToListAsync();

                return Ok(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching purchase orders");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET: api/PurchaseOrder/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var order = await _db.PurchaseOrders
                    .Include(po => po.Supplier)
                    .Include(po => po.Items)
                        .ThenInclude(i => i.Product)
                    .Include(po => po.PurchaseRequest)
                    .Include(po => po.Canvassing)
                    .Include(po => po.GoodsReceipts)
                    .FirstOrDefaultAsync(po => po.Id == id);

                if (order == null)
                    return NotFound(new { message = "Purchase order not found" });

                return Ok(order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching purchase order {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // POST: api/PurchaseOrder
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PurchaseOrderCreateDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                var order = new PurchaseOrder
                {
                    CompanyId = model.CompanyId,
                    PONumber = await GeneratePONumber(),
                    PurchaseRequestId = model.PurchaseRequestId,
                    CanvassingId = model.CanvassingId,
                    SupplierId = model.SupplierId,
                    OrderDate = DateTime.UtcNow,
                    RequiredDate = model.RequiredDate,
                    Status = "Draft",
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = userId,
                    ShippingAddress = model.ShippingAddress,
                    Notes = model.Notes
                };

                foreach (var item in model.Items)
                {
                    var poi = new PurchaseOrderItem
                    {
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        LineTotal = item.LineTotal
                    };
                    order.Items.Add(poi);
                }

                // Calculate totals
                CalculateTotals(order);

                _db.PurchaseOrders.Add(order);
                await _db.SaveChangesAsync();

                _logger.LogInformation("Purchase order {PONumber} created by user {UserId}",
                    order.PONumber, userId);

                return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating purchase order");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // PUT: api/PurchaseOrder/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] PurchaseOrderCreateDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (id != model.Id)
                return BadRequest(new { message = "ID mismatch" });

            try
            {
                var existingOrder = await _db.PurchaseOrders
                    .Include(po => po.Items)
                    .FirstOrDefaultAsync(po => po.Id == id);

                if (existingOrder == null)
                    return NotFound(new { message = "Purchase order not found" });

                if (existingOrder.Status != "Draft")
                    return BadRequest(new { message = "Cannot edit purchase order in current status" });

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                // Update fields
                existingOrder.SupplierId = model.SupplierId;
                existingOrder.RequiredDate = model.RequiredDate;
                existingOrder.ShippingAddress = model.ShippingAddress;
                existingOrder.Notes = model.Notes;
                existingOrder.ModifiedDate = DateTime.UtcNow;
                existingOrder.ModifiedBy = userId;

                // Update items
                _db.PurchaseOrderItems.RemoveRange(existingOrder.Items);
                existingOrder.Items = new List<PurchaseOrderItem>();
                foreach (var item in model.Items)
                {
                    existingOrder.Items.Add(new PurchaseOrderItem
                    {
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        LineTotal = item.LineTotal
                    });
                }

                // Recalculate totals
                CalculateTotals(existingOrder);

                await _db.SaveChangesAsync();

                _logger.LogInformation("Purchase order {Id} updated by user {UserId}", id, userId);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating purchase order {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // POST: api/PurchaseOrder/5/approve
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> Approve(int id)
        {
            try
            {
                var order = await _db.PurchaseOrders.FindAsync(id);

                if (order == null)
                    return NotFound(new { message = "Purchase order not found" });

                if (order.Status != "Draft" && order.Status != "PendingApproval")
                    return BadRequest(new { message = "Order cannot be approved in current status" });

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                order.Status = "Approved";
                order.ApprovedBy = userId;
                order.ApprovalDate = DateTime.UtcNow;
                order.ModifiedDate = DateTime.UtcNow;
                order.ModifiedBy = userId;

                await _db.SaveChangesAsync();

                _logger.LogInformation("Purchase order {Id} approved by user {UserId}", id, userId);

                return Ok(new { message = "Purchase order approved" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving purchase order {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // POST: api/PurchaseOrder/5/send
        [HttpPost("{id}/send")]
        public async Task<IActionResult> Send(int id)
        {
            try
            {
                var order = await _db.PurchaseOrders
                    .Include(po => po.Supplier)
                    .Include(po => po.Items)
                        .ThenInclude(i => i.Product)
                    .FirstOrDefaultAsync(po => po.Id == id);

                if (order == null)
                    return NotFound(new { message = "Purchase order not found" });

                if (order.Status != "Approved")
                    return BadRequest(new { message = "Only approved orders can be sent" });

                if (string.IsNullOrEmpty(order.Supplier?.Email))
                    return BadRequest(new { message = "Supplier email is not configured" });

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                // Delegate sending to PurchasingService which handles email and EmailLog creation
                await _purchasingService.SendPurchaseOrderAsync(order.Id, userId);

                return Ok(new { message = "Purchase order sent to supplier" });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Business rule violation sending purchase order {Id}", id);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending purchase order {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // POST: api/PurchaseOrder/5/confirm
        [HttpPost("{id}/confirm")]
        public async Task<IActionResult> Confirm(int id, [FromBody] ConfirmPORequest request)
        {
            try
            {
                var order = await _db.PurchaseOrders.FindAsync(id);

                if (order == null)
                    return NotFound(new { message = "Purchase order not found" });

                if (order.Status != "Sent")
                    return BadRequest(new { message = "Only sent orders can be confirmed" });

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                order.Status = "Confirmed";
                order.ConfirmedDate = DateTime.UtcNow;
                order.ModifiedDate = DateTime.UtcNow;
                order.ModifiedBy = userId;

                if (request.ExpectedDeliveryDate.HasValue)
                {
                    order.RequiredDate = request.ExpectedDeliveryDate;
                }

                await _db.SaveChangesAsync();

                _logger.LogInformation("Purchase order {Id} confirmed by supplier", id);

                return Ok(new { message = "Purchase order confirmed" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error confirming purchase order {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // DELETE: api/PurchaseOrder/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var order = await _db.PurchaseOrders
                    .Include(po => po.Items)
                    .Include(po => po.GoodsReceipts)
                    .FirstOrDefaultAsync(po => po.Id == id);

                if (order == null)
                    return NotFound(new { message = "Purchase order not found" });

                if (order.Status != "Draft")
                    return BadRequest(new { message = "Only draft orders can be deleted" });

                if (order.GoodsReceipts.Any())
                    return BadRequest(new { message = "Cannot delete order with goods receipts" });

                _db.PurchaseOrders.Remove(order);
                await _db.SaveChangesAsync();

                _logger.LogInformation("Purchase order {Id} deleted", id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting purchase order {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // Helper methods
        private void CalculateTotals(PurchaseOrder order)
        {
            order.SubTotal = order.Items.Sum(i => i.LineTotal);
            order.TotalAmount = order.SubTotal + order.TaxAmount - order.DiscountAmount + order.ShippingAmount;
        }

        private string GeneratePOEmailBody(PurchaseOrder order)
        {
            var body = $@"
Dear {order.Supplier?.ContactPerson ?? "Supplier"},

Please find attached our Purchase Order {order.PONumber}.

Order Details:
- PO Number: {order.PONumber}
- Order Date: {order.OrderDate:yyyy-MM-dd}
- Required Date: {order.RequiredDate:yyyy-MM-dd}
- Total Amount: ${order.TotalAmount:N2}

Items:
";
            foreach (var item in order.Items)
            {
                body += $"- {item.Product?.ProductName}: {item.Quantity} x ${item.UnitPrice:N2} = ${item.LineTotal:N2}\n";
            }

            body += @"

Please confirm receipt of this order and provide estimated delivery date.

Best regards,
Purchasing Department
";
            return body;
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

    public class ConfirmPORequest
    {
        public DateTime? ExpectedDeliveryDate { get; set; }
        public string? Notes { get; set; }
    }
}