using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERPSystem.Data;
using ERPSystem.Models;
using ERPSystem.DTOs;
using System.Security.Claims;
using ERPSystem.Services;
using Microsoft.AspNetCore.Hosting;

namespace ERPSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WarehouseController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<WarehouseController> _logger;
        private readonly PurchasingService _purchasing_service;
        private readonly IWebHostEnvironment _env;

        public WarehouseController(AppDbContext db, ILogger<WarehouseController> logger, PurchasingService purchasingService, IWebHostEnvironment env)
        {
            _db = db;
            _logger = logger;
            _purchasing_service = purchasingService;
            _env = env;
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
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid warehouse model state: {Errors}", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                return BadRequest(ModelState);
            }

            try
            {
                if (await _db.Warehouses.AnyAsync(w => w.WarehouseCode == model.WarehouseCode))
                    return Conflict(new { message = "Warehouse code already exists" });

                // Validate ManagerId refers to an existing employee when provided
                if (model.ManagerId.HasValue)
                {
                    var managerExists = await _db.Employees.AnyAsync(e => e.Id == model.ManagerId.Value);
                    if (!managerExists)
                    {
                        _logger.LogWarning("Warehouse create failed: manager {ManagerId} not found", model.ManagerId.Value);
                        return BadRequest(new { message = "Manager not found" });
                    }
                }

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
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = userId
                };

                _db.Warehouses.Add(w);
                try
                {
                    await _db.SaveChangesAsync();
                }
                catch (DbUpdateException dbEx)
                {
                    _logger.LogError(dbEx, "Database update error while creating warehouse: {Message}", dbEx.InnerException?.Message ?? dbEx.Message);
                    if (_env?.IsDevelopment() == true)
                        return Problem(detail: dbEx.ToString(), title: "Database error creating warehouse");
                    return StatusCode(500, new { message = "Database error creating warehouse" });
                }

                // Audit
                await _purchasing_service.AuditAsync(userId, "Create", "Warehouse", w.Id, $"Warehouse {w.WarehouseCode} created");

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
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating warehouse");
                if (_env?.IsDevelopment() == true)
                {
                    return Problem(detail: ex.ToString(), title: "Error creating warehouse");
                }
                return Problem(title: "An error occurred while creating the warehouse.");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] WarehouseCreateUpdateDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var w = await _db.Warehouses.FindAsync(id);
                if (w == null) return NotFound();

                if (!string.Equals(w.WarehouseCode, model.WarehouseCode, StringComparison.OrdinalIgnoreCase) &&
                    await _db.Warehouses.AnyAsync(x => x.WarehouseCode == model.WarehouseCode && x.Id != id))
                {
                    return Conflict(new { message = "Warehouse code already exists" });
                }

                // Validate ManagerId exists when provided
                if (model.ManagerId.HasValue)
                {
                    var managerExists = await _db.Employees.AnyAsync(e => e.Id == model.ManagerId.Value);
                    if (!managerExists)
                    {
                        _logger.LogWarning("Warehouse update failed: manager {ManagerId} not found", model.ManagerId.Value);
                        return BadRequest(new { message = "Manager not found" });
                    }
                }

                var userId = int.Parse(User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

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
                w.ModifiedDate = DateTime.UtcNow;
                w.ModifiedBy = userId;

                await _db.SaveChangesAsync();

                // Audit
                await _purchasing_service.AuditAsync(userId, "Update", "Warehouse", id, $"Warehouse {w.WarehouseCode} updated");

                return NoContent();
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database update error while updating warehouse: {Message}", dbEx.InnerException?.Message ?? dbEx.Message);
                if (_env?.IsDevelopment() == true)
                    return Problem(detail: dbEx.ToString(), title: "Database error updating warehouse");
                return StatusCode(500, new { message = "Database error updating warehouse" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating warehouse {Id}", id);
                if (_env?.IsDevelopment() == true)
                {
                    return Problem(detail: ex.ToString(), title: "Error updating warehouse");
                }
                return Problem(title: "An error occurred while updating the warehouse.");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var w = await _db.Warehouses.FindAsync(id);
            if (w == null) return NotFound();

            // Soft delete
            w.IsActive = false;
            var userId = int.Parse(User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            w.ModifiedDate = DateTime.UtcNow;
            w.ModifiedBy = userId;

            await _db.SaveChangesAsync();

            // Audit
            await _purchasing_service.AuditAsync(userId, "Delete", "Warehouse", id, $"Warehouse {w.WarehouseCode} deleted");

            return NoContent();
        }
    }
}
