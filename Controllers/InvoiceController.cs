using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERPSystem.Data;
using ERPSystem.Models;
using ERPSystem.Services;
using System.Security.Claims;

namespace ERPSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "Purchase")]
    public class InvoiceController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<InvoiceController> _logger;
        private readonly PurchasingService _purchasingService;

        public InvoiceController(AppDbContext db, ILogger<InvoiceController> logger, PurchasingService purchasingService)
        {
            _db = db;
            _logger = logger;
            _purchasingService = purchasingService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0 || pageSize > 500) pageSize = 50;

            var q = _db.Invoices.Include(i => i.PurchaseOrder).Include(i => i.Supplier).AsQueryable();
            var total = await q.CountAsync();
            var items = await q.OrderByDescending(i => i.CreatedDate)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .ToListAsync();

            return Ok(new { Items = items, Total = total, Page = page, PageSize = pageSize });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var inv = await _db.Invoices.Include(i => i.PurchaseOrder).Include(i => i.Items).ThenInclude(it => it.Product).FirstOrDefaultAsync(i => i.Id == id);
            if (inv == null) return NotFound(new { message = "Invoice not found" });
            return Ok(inv);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] DTOs.InvoiceCreateDto model)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var inv = new Invoice
            {
                CompanyId = model.CompanyId,
                InvoiceNumber = model.InvoiceNumber ?? string.Empty,
                PurchaseOrderId = model.PurchaseOrderId,
                SupplierId = model.SupplierId,
                InvoiceDate = model.InvoiceDate ?? DateTime.UtcNow,
                TotalAmount = model.TotalAmount,
                Status = "Draft",
                CreatedDate = DateTime.UtcNow,
                CreatedBy = userId
            };

            foreach (var it in model.Items ?? Enumerable.Empty<DTOs.InvoiceItemCreateDto>())
            {
                inv.Items.Add(new InvoiceItem
                {
                    ProductId = it.ProductId,
                    Quantity = it.Quantity,
                    UnitPrice = it.UnitPrice,
                    LineTotal = it.LineTotal
                });
            }

            _db.Invoices.Add(inv);
            await _db.SaveChangesAsync();

            await _purchasingService.AuditAsync(userId, "Create", "Invoice", inv.Id, $"Invoice {inv.InvoiceNumber} created");

            return CreatedAtAction(nameof(Get), new { id = inv.Id }, inv);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DTOs.InvoiceCreateDto model)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            if (id != model.Id) return BadRequest(new { message = "ID mismatch" });

            var inv = await _db.Invoices.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == id);
            if (inv == null) return NotFound(new { message = "Invoice not found" });

            if (inv.Status != "Draft") return BadRequest(new { message = "Only draft invoices can be edited" });

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            inv.InvoiceNumber = model.InvoiceNumber ?? inv.InvoiceNumber;
            inv.PurchaseOrderId = model.PurchaseOrderId;
            inv.SupplierId = model.SupplierId;
            inv.InvoiceDate = model.InvoiceDate ?? inv.InvoiceDate;
            inv.TotalAmount = model.TotalAmount;
            inv.ModifiedDate = DateTime.UtcNow;
            inv.ModifiedBy = userId;

            _db.InvoiceItems.RemoveRange(inv.Items);
            inv.Items = new List<InvoiceItem>();
            foreach (var it in model.Items ?? Enumerable.Empty<DTOs.InvoiceItemCreateDto>())
            {
                inv.Items.Add(new InvoiceItem
                {
                    ProductId = it.ProductId,
                    Quantity = it.Quantity,
                    UnitPrice = it.UnitPrice,
                    LineTotal = it.LineTotal
                });
            }

            await _db.SaveChangesAsync();
            await _purchasingService.AuditAsync(userId, "Update", "Invoice", inv.Id, $"Invoice {inv.InvoiceNumber} updated");

            return NoContent();
        }

        [HttpPost("{id}/encode")]
        public async Task<IActionResult> Encode(int id)
        {
            var inv = await _db.Invoices.FindAsync(id);
            if (inv == null) return NotFound(new { message = "Invoice not found" });
            if (inv.Status != "Draft") return BadRequest(new { message = "Only draft invoices can be encoded" });
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            inv.Status = "Encoded";
            inv.ModifiedDate = DateTime.UtcNow;
            inv.ModifiedBy = userId;
            await _db.SaveChangesAsync();
            await _purchasingService.AuditAsync(userId, "Encode", "Invoice", inv.Id, $"Invoice {inv.InvoiceNumber} encoded");
            return Ok(new { message = "Invoice encoded" });
        }

        [HttpPost("{id}/approve")]
        [Authorize(Policy = "Accounting")]
        public async Task<IActionResult> Approve(int id)
        {
            var inv = await _db.Invoices.FindAsync(id);
            if (inv == null) return NotFound(new { message = "Invoice not found" });
            if (inv.Status != "Encoded") return BadRequest(new { message = "Only encoded invoices can be approved" });
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            inv.Status = "Approved";
            inv.ApprovedDate = DateTime.UtcNow;
            inv.ModifiedDate = DateTime.UtcNow;
            inv.ModifiedBy = userId;
            await _db.SaveChangesAsync();
            await _purchasingService.AuditAsync(userId, "Approve", "Invoice", inv.Id, $"Invoice {inv.InvoiceNumber} approved");
            return Ok(new { message = "Invoice approved" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var inv = await _db.Invoices.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == id);
            if (inv == null) return NotFound(new { message = "Invoice not found" });
            if (inv.Status != "Draft") return BadRequest(new { message = "Only draft invoices can be deleted" });
            _db.Invoices.Remove(inv);
            await _db.SaveChangesAsync();
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            await _purchasingService.AuditAsync(userId, "Delete", "Invoice", inv.Id, $"Invoice {inv.InvoiceNumber} deleted");
            return NoContent();
        }
    }
}
