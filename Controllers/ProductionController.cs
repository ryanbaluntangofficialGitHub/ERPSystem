using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERPSystem.Data;
using ERPSystem.Models;

namespace ERPSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "Production")]
    public class ProductionController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<ProductionController> _logger;

        public ProductionController(AppDbContext db, ILogger<ProductionController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            try
            {
                var products = await _db.Products
                    .OrderBy(p => p.Name)
                    .ToListAsync();
                return Ok(products);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching products");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            try
            {
                var item = await _db.Products.FindAsync(id);
                if (item == null)
                    return NotFound(new { message = "Product not found" });
                return Ok(item);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching product {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] Product product)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                _db.Products.Add(product);
                await _db.SaveChangesAsync();

                _logger.LogInformation("Product {Id} created by {User}",
                    product.Id, User.Identity?.Name);

                return CreatedAtAction(nameof(Get), new { id = product.Id }, product);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] Product product)
        {
            if (id != product.Id)
                return BadRequest(new { message = "ID mismatch" });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _db.Entry(product).State = EntityState.Modified;

            try
            {
                await _db.SaveChangesAsync();
                _logger.LogInformation("Product {Id} updated by {User}",
                    product.Id, User.Identity?.Name);
                return NoContent();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _db.Products.AnyAsync(e => e.Id == id))
                    return NotFound(new { message = "Product not found" });
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var item = await _db.Products.FindAsync(id);
                if (item == null)
                    return NotFound(new { message = "Product not found" });

                _db.Products.Remove(item);
                await _db.SaveChangesAsync();

                _logger.LogInformation("Product {Id} deleted by {User}",
                    id, User.Identity?.Name);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}