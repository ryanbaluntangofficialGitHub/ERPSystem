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
    [Authorize(Policy = "HR")]
    public class EmployeeController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<EmployeeController> _logger;

        public EmployeeController(AppDbContext db, ILogger<EmployeeController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? companyId, [FromQuery] string? query, [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0 || pageSize > 200) pageSize = 25;

            var q = _db.Employees.Include(e => e.DepartmentNav).AsNoTracking().AsQueryable();
            if (companyId.HasValue) q = q.Where(e => e.CompanyId == companyId.Value);
            if (!string.IsNullOrWhiteSpace(query))
            {
                var s = query.Trim().ToLower();
                q = q.Where(e => e.EmployeeCode.ToLower().Contains(s) || e.Name.ToLower().Contains(s));
            }

            var total = await q.CountAsync();
            var items = await q.OrderBy(e => e.Name)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .Select(e => new EmployeeDto
                {
                    Id = e.Id,
                    CompanyId = e.CompanyId,
                    EmployeeCode = e.EmployeeCode,
                    Name = e.Name,
                    Position = e.Position,
                    Department = e.Department,
                    DepartmentId = e.DepartmentId,
                    DepartmentName = e.DepartmentNav != null ? e.DepartmentNav.DepartmentName : null,
                    Email = e.Email,
                    Phone = e.Phone,
                    HireDate = e.HireDate,
                    IsActive = e.IsActive,
                    CreatedDate = e.CreatedDate,
                    CreatedBy = e.CreatedBy,
                    ModifiedDate = e.ModifiedDate,
                    ModifiedBy = e.ModifiedBy
                }).ToListAsync();

            return Ok(new { Items = items, Total = total, Page = page, PageSize = pageSize });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var e = await _db.Employees.Include(x => x.DepartmentNav).FirstOrDefaultAsync(x => x.Id == id);
            if (e == null) return NotFound();

            var dto = new EmployeeDto
            {
                Id = e.Id,
                CompanyId = e.CompanyId,
                EmployeeCode = e.EmployeeCode,
                Name = e.Name,
                Position = e.Position,
                Department = e.Department,
                DepartmentId = e.DepartmentId,
                DepartmentName = e.DepartmentNav?.DepartmentName,
                Email = e.Email,
                Phone = e.Phone,
                HireDate = e.HireDate,
                IsActive = e.IsActive,
                CreatedDate = e.CreatedDate,
                CreatedBy = e.CreatedBy,
                ModifiedDate = e.ModifiedDate,
                ModifiedBy = e.ModifiedBy
            };

            return Ok(dto);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] EmployeeCreateUpdateDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (await _db.Employees.AnyAsync(x => x.EmployeeCode == model.EmployeeCode))
                return Conflict(new { message = "Employee code already exists" });

            var userIdString = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userId = int.TryParse(userIdString, out var uid) ? uid : 0;

            var e = new Employee
            {
                CompanyId = model.CompanyId,
                EmployeeCode = model.EmployeeCode.Trim(),
                Name = model.Name.Trim(),
                Position = model.Position,
                Department = model.Department,
                DepartmentId = model.DepartmentId,
                Email = model.Email,
                Phone = model.Phone,
                HireDate = model.HireDate,
                IsActive = model.IsActive,
                CreatedDate = DateTime.UtcNow,
                CreatedBy = userId
            };

            _db.Employees.Add(e);
            await _db.SaveChangesAsync();

            var dto = new EmployeeDto
            {
                Id = e.Id,
                CompanyId = e.CompanyId,
                EmployeeCode = e.EmployeeCode,
                Name = e.Name,
                Position = e.Position,
                Department = e.Department,
                DepartmentId = e.DepartmentId,
                DepartmentName = e.DepartmentNav?.DepartmentName,
                Email = e.Email,
                Phone = e.Phone,
                HireDate = e.HireDate,
                IsActive = e.IsActive,
                CreatedDate = e.CreatedDate,
                CreatedBy = e.CreatedBy
            };

            return CreatedAtAction(nameof(Get), new { id = e.Id }, dto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] EmployeeCreateUpdateDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var e = await _db.Employees.FindAsync(id);
            if (e == null) return NotFound();

            if (!string.Equals(e.EmployeeCode, model.EmployeeCode, StringComparison.OrdinalIgnoreCase) &&
                await _db.Employees.AnyAsync(x => x.EmployeeCode == model.EmployeeCode && x.Id != id))
                return Conflict(new { message = "Employee code already exists" });

            e.CompanyId = model.CompanyId;
            e.EmployeeCode = model.EmployeeCode.Trim();
            e.Name = model.Name.Trim();
            e.Position = model.Position;
            e.Department = model.Department;
            e.DepartmentId = model.DepartmentId;
            e.Email = model.Email;
            e.Phone = model.Phone;
            e.HireDate = model.HireDate;
            e.IsActive = model.IsActive;
            e.ModifiedDate = DateTime.UtcNow;
            var modUserIdString = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            e.ModifiedBy = int.TryParse(modUserIdString, out var mid) ? mid : 0;

            await _db.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var e = await _db.Employees.FindAsync(id);
            if (e == null) return NotFound();

            e.IsActive = false;
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
