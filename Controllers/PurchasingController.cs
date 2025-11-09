using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERPSystem.Data;
using ERPSystem.Models;

namespace ERPSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "Purchase")]
    public class PurchasingController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<PurchasingController> _logger;

        public PurchasingController(AppDbContext db, ILogger<PurchasingController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            try
            {
                var orders = await _db.PurchaseOrders
                    .OrderByDescending(o => o.Date)
                    .ToListAsync();
                return Ok(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching purchase orders");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            try
            {
                var item = await _db.PurchaseOrders.FindAsync(id);
                if (item == null)
                    return NotFound(new { message = "Purchase order not found" });
                return Ok(item);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching purchase order {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] PurchaseOrder order)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                order.Date = DateTime.UtcNow;
                _db.PurchaseOrders.Add(order);
                await _db.SaveChangesAsync();

                _logger.LogInformation("Purchase order {Id} created by {User}",
                    order.Id, User.Identity?.Name);

                return CreatedAtAction(nameof(Get), new { id = order.Id }, order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating purchase order");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] PurchaseOrder order)
        {
            if (id != order.Id)
                return BadRequest(new { message = "ID mismatch" });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _db.Entry(order).State = EntityState.Modified;

            try
            {
                await _db.SaveChangesAsync();
                _logger.LogInformation("Purchase order {Id} updated by {User}",
                    order.Id, User.Identity?.Name);
                return NoContent();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _db.PurchaseOrders.AnyAsync(e => e.Id == id))
                    return NotFound(new { message = "Purchase order not found" });
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating purchase order {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var item = await _db.PurchaseOrders.FindAsync(id);
                if (item == null)
                    return NotFound(new { message = "Purchase order not found" });

                _db.PurchaseOrders.Remove(item);
                await _db.SaveChangesAsync();

                _logger.LogInformation("Purchase order {Id} deleted by {User}",
                    id, User.Identity?.Name);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting purchase order {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}