using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERPSystem.Data;
using ERPSystem.Models;

namespace ERPSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "Accounting")]
    public class AccountingController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<AccountingController> _logger;

        public AccountingController(AppDbContext db, ILogger<AccountingController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            try
            {
                var expenses = await _db.Expenses
                    .OrderByDescending(e => e.Date)
                    .ToListAsync();
                return Ok(expenses);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching expenses");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            try
            {
                var item = await _db.Expenses.FindAsync(id);
                if (item == null)
                    return NotFound(new { message = "Expense not found" });
                return Ok(item);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching expense {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] Expense expense)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                expense.Date = DateTime.UtcNow;
                _db.Expenses.Add(expense);
                await _db.SaveChangesAsync();

                _logger.LogInformation("Expense {Id} created by {User}",
                    expense.Id, User.Identity?.Name);

                return CreatedAtAction(nameof(Get), new { id = expense.Id }, expense);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating expense");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] Expense expense)
        {
            if (id != expense.Id)
                return BadRequest(new { message = "ID mismatch" });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _db.Entry(expense).State = EntityState.Modified;

            try
            {
                await _db.SaveChangesAsync();
                _logger.LogInformation("Expense {Id} updated by {User}",
                    expense.Id, User.Identity?.Name);
                return NoContent();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _db.Expenses.AnyAsync(e => e.Id == id))
                    return NotFound(new { message = "Expense not found" });
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating expense {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var item = await _db.Expenses.FindAsync(id);
                if (item == null)
                    return NotFound(new { message = "Expense not found" });

                _db.Expenses.Remove(item);
                await _db.SaveChangesAsync();

                _logger.LogInformation("Expense {Id} deleted by {User}",
                    id, User.Identity?.Name);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting expense {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}