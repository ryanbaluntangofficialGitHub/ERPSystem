using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERPSystem.Data;
using ERPSystem.Models;

namespace ERPSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "HR")]
    public class HRController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<HRController> _logger;

        public HRController(AppDbContext db, ILogger<HRController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            try
            {
                var employees = await _db.Employees
                    .OrderBy(e => e.Name)
                    .ToListAsync();
                return Ok(employees);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching employees");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            try
            {
                var item = await _db.Employees.FindAsync(id);
                if (item == null)
                    return NotFound(new { message = "Employee not found" });
                return Ok(item);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching employee {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] Employee employee)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                employee.HireDate = DateTime.UtcNow;
                employee.IsActive = true;

                _db.Employees.Add(employee);
                await _db.SaveChangesAsync();

                _logger.LogInformation("Employee {Id} created by {User}",
                    employee.Id, User.Identity?.Name);

                return CreatedAtAction(nameof(Get), new { id = employee.Id }, employee);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating employee");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] Employee employee)
        {
            if (id != employee.Id)
                return BadRequest(new { message = "ID mismatch" });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _db.Entry(employee).State = EntityState.Modified;

            try
            {
                await _db.SaveChangesAsync();
                _logger.LogInformation("Employee {Id} updated by {User}",
                    employee.Id, User.Identity?.Name);
                return NoContent();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _db.Employees.AnyAsync(e => e.Id == id))
                    return NotFound(new { message = "Employee not found" });
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating employee {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var item = await _db.Employees.FindAsync(id);
                if (item == null)
                    return NotFound(new { message = "Employee not found" });

                // Soft delete - just mark as inactive
                item.IsActive = false;
                await _db.SaveChangesAsync();

                _logger.LogInformation("Employee {Id} deactivated by {User}",
                    id, User.Identity?.Name);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting employee {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveEmployees()
        {
            try
            {
                var employees = await _db.Employees
                    .Where(e => e.IsActive)
                    .OrderBy(e => e.Name)
                    .ToListAsync();
                return Ok(employees);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching active employees");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("departments")]
        public async Task<IActionResult> GetDepartments()
        {
            try
            {
                var departments = await _db.Employees
                    .Where(e => e.IsActive)
                    .Select(e => e.Department)
                    .Distinct()
                    .OrderBy(d => d)
                    .ToListAsync();
                return Ok(departments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching departments");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}