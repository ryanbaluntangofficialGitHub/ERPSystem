using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERPSystem.Data;
using ERPSystem.Models;
using System.Security.Claims;
using ERPSystem.Services;

namespace ERPSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class GoodsReceiptController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<GoodsReceiptController> _logger;
        private readonly PurchasingService _purchasingService;

        public GoodsReceiptController(AppDbContext db, ILogger<GoodsReceiptController> logger, PurchasingService purchasingService)
        {
            _db = db;
            _logger = logger;
            _purchasingService = purchasingService;
        }

        // GET: api/GoodsReceipt
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var receipts = await _db.GoodsReceipts
                    .Include(gr => gr.PurchaseOrder)
                        .ThenInclude(po => po.Supplier)
                    .Include(gr => gr.Warehouse)
                    .Include(gr => gr.Items)
                        .ThenInclude(i => i.Product)
                    .OrderByDescending(gr => gr.ReceiptDate)
                    .ToListAsync();

                return Ok(receipts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching goods receipts");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET: api/GoodsReceipt/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var receipt = await _db.GoodsReceipts
                    .Include(gr => gr.PurchaseOrder)
                        .ThenInclude(po => po.Supplier)
                    .Include(gr => gr.PurchaseOrder)
                        .ThenInclude(po => po.Items)
                            .ThenInclude(i => i.Product)
                    .Include(gr => gr.Warehouse)
                    .Include(gr => gr.Items)
                        .ThenInclude(i => i.Product)
                    .FirstOrDefaultAsync(gr => gr.Id == id);

                if (receipt == null)
                    return NotFound(new { message = "Goods receipt not found" });

                return Ok(receipt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching goods receipt {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET: api/GoodsReceipt/by-po/5
        [HttpGet("by-po/{poId}")]
        public async Task<IActionResult> GetByPurchaseOrder(int poId)
        {
            try
            {
                var receipts = await _db.GoodsReceipts
                    .Include(gr => gr.Items)
                        .ThenInclude(i => i.Product)
                    .Where(gr => gr.PurchaseOrderId == poId)
                    .OrderByDescending(gr => gr.ReceiptDate)
                    .ToListAsync();

                return Ok(receipts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching goods receipts for PO {POId}", poId);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // POST: api/GoodsReceipt
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] GoodsReceipt receipt)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                var created = await _purchasingService.CreateGoodsReceiptAsync(receipt, userId);

                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Business rule violation creating goods receipt");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating goods receipt");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // POST: api/GoodsReceipt/5/approve
        [HttpPost("{id}/approve")]
        [Authorize(Policy = "Purchase")]
        public async Task<IActionResult> Approve(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                await _purchasingService.ApproveGoodsReceiptAsync(id, userId);

                return Ok(new { message = "Goods receipt approved" });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Business rule violation approving goods receipt {Id}", id);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving goods receipt {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // DELETE: api/GoodsReceipt/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var receipt = await _db.GoodsReceipts
                    .Include(gr => gr.Items)
                    .FirstOrDefaultAsync(gr => gr.Id == id);

                if (receipt == null)
                    return NotFound(new { message = "Goods receipt not found" });

                if (receipt.Status != "Draft")
                    return BadRequest(new { message = "Only draft receipts can be deleted" });

                // Rollback PO item received quantities
                var po = await _db.PurchaseOrders
                    .Include(p => p.Items)
                    .FirstOrDefaultAsync(p => p.Id == receipt.PurchaseOrderId);

                if (po != null)
                {
                    foreach (var grItem in receipt.Items)
                    {
                        var poItem = po.Items.FirstOrDefault(i => i.Id == grItem.PurchaseOrderItemId);
                        if (poItem != null)
                        {
                            poItem.ReceivedQuantity -= grItem.ReceivedQuantity;
                        }
                    }

                    // Update PO status
                    var anyReceived = po.Items.Any(i => i.ReceivedQuantity > 0);
                    po.Status = anyReceived ? "PartiallyReceived" : "Confirmed";
                }

                _db.GoodsReceipts.Remove(receipt);
                await _db.SaveChangesAsync();

                _logger.LogInformation("Goods receipt {Id} deleted", id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting goods receipt {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}