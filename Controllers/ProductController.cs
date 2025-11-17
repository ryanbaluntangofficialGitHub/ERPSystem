using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERPSystem.Data;
using ERPSystem.Models;
using ERPSystem.DTOs;
using System.Security.Claims;
using ERPSystem.Services;

namespace ERPSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "Production")]
    public class ProductController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<ProductController> _logger;
        private readonly PurchasingService _purchasingService;
        private readonly CodeGenerator _codeGenerator;

        public ProductController(AppDbContext db, ILogger<ProductController> logger, PurchasingService purchasingService, CodeGenerator codeGenerator)
        {
            _db = db;
            _logger = logger;
            _purchasingService = purchasingService;
            _codeGenerator = codeGenerator;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? companyId, [FromQuery] string? query, [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0 || pageSize > 200) pageSize = 25;

            var q = _db.Products.AsNoTracking().AsQueryable();
            if (companyId.HasValue) q = q.Where(p => p.CompanyId == companyId.Value);
            if (!string.IsNullOrWhiteSpace(query))
            {
                var s = query.Trim().ToLower();
                q = q.Where(p => p.ProductCode.ToLower().Contains(s) || p.Name.ToLower().Contains(s));
            }

            var total = await q.CountAsync();
            var items = await q.OrderBy(p => p.Name)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .Select(p => new ProductDto {
                    Id = p.Id,
                    CompanyId = p.CompanyId,
                    ProductCode = p.ProductCode,
                    Name = p.Name,
                    Description = p.Description,
                    UnitOfMeasure = p.UnitOfMeasure,
                    Price = p.Price,
                    Quantity = p.Quantity,
                    IsActive = p.IsActive,
                    CreatedDate = p.CreatedDate
                }).ToListAsync();

            return Ok(new { Items = items, Total = total, Page = page, PageSize = pageSize });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var p = await _db.Products.FindAsync(id);
            if (p == null) return NotFound();
            var dto = new ProductDto
            {
                Id = p.Id,
                CompanyId = p.CompanyId,
                ProductCode = p.ProductCode,
                Name = p.Name,
                Description = p.Description,
                UnitOfMeasure = p.UnitOfMeasure,
                Price = p.Price,
                Quantity = p.Quantity,
                IsActive = p.IsActive,
                CreatedDate = p.CreatedDate
            };
            return Ok(dto);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ProductCreateUpdateDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (await _db.Products.AnyAsync(p => p.ProductCode == model.ProductCode))
                return Conflict(new { message = "Product code already exists" });

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var prod = new Product
            {
                CompanyId = model.CompanyId,
                ProductCode = string.IsNullOrWhiteSpace(model.ProductCode) ? await _codeGenerator.GeneratePrefixedDocumentNumberAsync("PD", 14) : model.ProductCode.Trim(),
                Name = model.Name.Trim(),
                Description = model.Description,
                UnitOfMeasure = model.UnitOfMeasure,
                Price = model.Price,
                Quantity = model.Quantity,
                IsActive = model.IsActive,
                CreatedDate = DateTime.UtcNow,
                CreatedBy = userId
            };

            _db.Products.Add(prod);
            await _db.SaveChangesAsync();

            // Audit
            await _purchasingService.AuditAsync(userId, "Create", "Product", prod.Id, $"Product {prod.ProductCode} created");

            var dto = new ProductDto
            {
                Id = prod.Id,
                CompanyId = prod.CompanyId,
                ProductCode = prod.ProductCode,
                Name = prod.Name,
                Description = prod.Description,
                UnitOfMeasure = prod.UnitOfMeasure,
                Price = prod.Price,
                Quantity = prod.Quantity,
                IsActive = prod.IsActive,
                CreatedDate = prod.CreatedDate
            };

            return CreatedAtAction(nameof(Get), new { id = prod.Id }, dto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ProductCreateUpdateDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Use route id to find product; do not compare with CompanyId
            var prod = await _db.Products.FindAsync(id);
            if (prod == null) return NotFound();

            if (!string.Equals(prod.ProductCode, model.ProductCode, StringComparison.OrdinalIgnoreCase))
            {
                if (await _db.Products.AnyAsync(p => p.ProductCode == model.ProductCode && p.Id != id))
                    return Conflict(new { message = "Product code already exists" });
                prod.ProductCode = model.ProductCode.Trim();
            }

            prod.CompanyId = model.CompanyId;
            prod.Name = model.Name.Trim();
            prod.Description = model.Description;
            prod.UnitOfMeasure = model.UnitOfMeasure;
            prod.Price = model.Price;
            prod.Quantity = model.Quantity;
            prod.IsActive = model.IsActive;
            prod.ModifiedDate = DateTime.UtcNow;
            prod.ModifiedBy = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            await _db.SaveChangesAsync();

            // Audit
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            await _purchasingService.AuditAsync(userId, "Update", "Product", prod.Id, $"Product {prod.ProductCode} updated");

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var prod = await _db.Products.FindAsync(id);
            if (prod == null) return NotFound();

            // Soft delete
            prod.IsActive = false;
            prod.ModifiedDate = DateTime.UtcNow;
            prod.ModifiedBy = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            await _db.SaveChangesAsync();

            // Audit
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            await _purchasingService.AuditAsync(userId, "Delete", "Product", id, $"Product {prod.ProductCode} deleted");

            return NoContent();
        }

        // Stock adjustment endpoint
        [HttpPost("{id}/adjust")]
        public async Task<IActionResult> AdjustStock(int id, [FromBody] StockAdjustmentDto dto)
        {
            if (dto == null) return BadRequest();
            var prod = await _db.Products.FindAsync(id);
            if (prod == null) return NotFound();

            prod.Quantity += dto.Adjustment;
            prod.ModifiedDate = DateTime.UtcNow;
            prod.ModifiedBy = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            await _db.SaveChangesAsync();

            // Audit
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            await _purchasingService.AuditAsync(userId, "AdjustStock", "Product", id, $"Adjusted stock by {dto.Adjustment}");

            return Ok(new { prod.Id, prod.Quantity });
        }
    }

    public class StockAdjustmentDto { public int Adjustment { get; set; } }
}