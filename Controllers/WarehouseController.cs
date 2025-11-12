using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERPSystem.Data;
using ERPSystem.Models;
using ERPSystem.DTOs;
using System.Security.Claims;

namespace ERPSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WarehouseController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<WarehouseController> _logger;

        public WarehouseController(AppDbContext db, ILogger<WarehouseController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool activeOnly = false, [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0 || pageSize > 200) pageSize = 25;

            var q = _db.Warehouses.AsNoTracking().AsQueryable();
            if (activeOnly) q = q.Where(w => w.IsActive);

            var total = await q.CountAsync();
            var items = await q.OrderBy(w => w.WarehouseName)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .Select(w => new WarehouseDto
                {
                    Id = w.Id,
                    CompanyId = w.CompanyId,
                    WarehouseCode = w.WarehouseCode,
                    WarehouseName = w.WarehouseName,
                    Address = w.Address,
                    City = w.City,
                    State = w.State,
                    Country = w.Country,
                    PostalCode = w.PostalCode,
                    ManagerId = w.ManagerId,
                    IsActive = w.IsActive,
                    CreatedDate = w.CreatedDate
                }).ToListAsync();

            return Ok(new { Items = items, Total = total, Page = page, PageSize = pageSize });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var w = await _db.Warehouses.FindAsync(id);
            if (w == null) return NotFound();

            var dto = new WarehouseDto
            {
                Id = w.Id,
                CompanyId = w.CompanyId,
                WarehouseCode = w.WarehouseCode,
                WarehouseName = w.WarehouseName,
                Address = w.Address,
                City = w.City,
                State = w.State,
                Country = w.Country,
                PostalCode = w.PostalCode,
                ManagerId = w.ManagerId,
                IsActive = w.IsActive,
                CreatedDate = w.CreatedDate
            };

            return Ok(dto);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] WarehouseCreateUpdateDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (await _db.Warehouses.AnyAsync(w => w.WarehouseCode == model.WarehouseCode))
                return Conflict(new { message = "Warehouse code already exists" });

            var userId = int.Parse(User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var w = new Warehouse
            {
                CompanyId = model.CompanyId,
                WarehouseCode = model.WarehouseCode.Trim(),
                WarehouseName = model.WarehouseName.Trim(),
                Address = model.Address,
                City = model.City,
                State = model.State,
                Country = model.Country,
                PostalCode = model.PostalCode,
                ManagerId = model.ManagerId,
                IsActive = model.IsActive,
                CreatedDate = DateTime.UtcNow
            };

            _db.Warehouses.Add(w);
            await _db.SaveChangesAsync();

            var dto = new WarehouseDto
            {
                Id = w.Id,
                CompanyId = w.CompanyId,
                WarehouseCode = w.WarehouseCode,
                WarehouseName = w.WarehouseName,
                Address = w.Address,
                City = w.City,
                State = w.State,
                Country = w.Country,
                PostalCode = w.PostalCode,
                ManagerId = w.ManagerId,
                IsActive = w.IsActive,
                CreatedDate = w.CreatedDate
            };

            return CreatedAtAction(nameof(Get), new { id = w.Id }, dto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] WarehouseCreateUpdateDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var w = await _db.Warehouses.FindAsync(id);
            if (w == null) return NotFound();

            if (!string.Equals(w.WarehouseCode, model.WarehouseCode, StringComparison.OrdinalIgnoreCase) &&
                await _db.Warehouses.AnyAsync(x => x.WarehouseCode == model.WarehouseCode && x.Id != id))
            {
                return Conflict(new { message = "Warehouse code already exists" });
            }

            w.CompanyId = model.CompanyId;
            w.WarehouseCode = model.WarehouseCode.Trim();
            w.WarehouseName = model.WarehouseName.Trim();
            w.Address = model.Address;
            w.City = model.City;
            w.State = model.State;
            w.Country = model.Country;
            w.PostalCode = model.PostalCode;
            w.ManagerId = model.ManagerId;
            w.IsActive = model.IsActive;

            await _db.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var w = await _db.Warehouses.FindAsync(id);
            if (w == null) return NotFound();

            // Soft delete
            w.IsActive = false;
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
