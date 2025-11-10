using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERPSystem.Data;
using ERPSystem.Models;

namespace ERPSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DepartmentController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<DepartmentController> _logger;

        public DepartmentController(AppDbContext db, ILogger<DepartmentController> logger)
        {
            _db = db;
            _logger = logger;
        }

        // GET: api/Department
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool activeOnly = false)
        {
            try
            {
                var query = _db.Departments.AsQueryable();

                if (activeOnly)
                {
                    query = query.Where(d => d.IsActive);
                }

                var departments = await query
                    .OrderBy(d => d.DepartmentName)
                    .ToListAsync();

                return Ok(departments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching departments");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET: api/Department/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var department = await _db.Departments.FindAsync(id);

                if (department == null)
                    return NotFound(new { message = "Department not found" });

                return Ok(department);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching department {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // POST: api/Department
        [HttpPost]
        [Authorize(Policy = "HR")]
        public async Task<IActionResult> Create([FromBody] Department department)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                department.CreatedDate = DateTime.UtcNow;
                department.CompanyId = 1; // TODO: Get from user context
                department.IsActive = true;

                _db.Departments.Add(department);
                await _db.SaveChangesAsync();

                _logger.LogInformation("Department {DepartmentName} created", department.DepartmentName);

                return CreatedAtAction(nameof(GetById), new { id = department.Id }, department);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating department");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // PUT: api/Department/5
        [HttpPut("{id}")]
        [Authorize(Policy = "HR")]
        public async Task<IActionResult> Update(int id, [FromBody] Department department)
        {
            if (id != department.Id)
                return BadRequest(new { message = "ID mismatch" });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var existingDepartment = await _db.Departments.FindAsync(id);

                if (existingDepartment == null)
                    return NotFound(new { message = "Department not found" });

                existingDepartment.DepartmentName = department.DepartmentName;
                existingDepartment.Description = department.Description;
                existingDepartment.ManagerId = department.ManagerId;

                await _db.SaveChangesAsync();

                _logger.LogInformation("Department {Id} updated", id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating department {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // DELETE: api/Department/5
        [HttpDelete("{id}")]
        [Authorize(Policy = "HR")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var department = await _db.Departments.FindAsync(id);

                if (department == null)
                    return NotFound(new { message = "Department not found" });

                // Check if department has employees
                var hasEmployees = await _db.Employees.AnyAsync(e => e.DepartmentId == id);

                if (hasEmployees)
                {
                    // Soft delete
                    department.IsActive = false;
                    await _db.SaveChangesAsync();

                    _logger.LogInformation("Department {Id} deactivated (has employees)", id);

                    return Ok(new { message = "Department deactivated (has employees)" });
                }

                // Hard delete
                _db.Departments.Remove(department);
                await _db.SaveChangesAsync();

                _logger.LogInformation("Department {Id} deleted", id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting department {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}