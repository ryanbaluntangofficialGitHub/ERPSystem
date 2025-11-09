using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERPSystem.Data;
using ERPSystem.Models;

namespace ERPSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "Sales")]
    public class SalesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<SalesController> _logger;

        public SalesController(AppDbContext db, ILogger<SalesController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            try
            {
                var orders = await _db.SalesOrders
                    .OrderByDescending(o => o.SaleDate)
                    .ToListAsync();
                return Ok(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching sales orders");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            try
            {
                var item = await _db.SalesOrders.FindAsync(id);
                if (item == null)
                    return NotFound(new { message = "Sales order not found" });
                return Ok(item);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching sales order {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] SalesOrder order)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                order.SaleDate = DateTime.UtcNow;
                _db.SalesOrders.Add(order);
                await _db.SaveChangesAsync();

                _logger.LogInformation("Sales order {Id} created by {User}",
                    order.Id, User.Identity?.Name);

                return CreatedAtAction(nameof(Get), new { id = order.Id }, order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating sales order");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] SalesOrder order)
        {
            if (id != order.Id)
                return BadRequest(new { message = "ID mismatch" });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _db.Entry(order).State = EntityState.Modified;

            try
            {
                await _db.SaveChangesAsync();
                _logger.LogInformation("Sales order {Id} updated by {User}",
                    order.Id, User.Identity?.Name);
                return NoContent();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _db.SalesOrders.AnyAsync(e => e.Id == id))
                    return NotFound(new { message = "Sales order not found" });
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating sales order {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var item = await _db.SalesOrders.FindAsync(id);
                if (item == null)
                    return NotFound(new { message = "Sales order not found" });

                _db.SalesOrders.Remove(item);
                await _db.SaveChangesAsync();

                _logger.LogInformation("Sales order {Id} deleted by {User}",
                    id, User.Identity?.Name);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting sales order {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}