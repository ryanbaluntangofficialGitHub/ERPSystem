using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERPSystem.Data;
using ERPSystem.Models;
using System.Security.Claims;

namespace ERPSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "Purchase")]
    public class SupplierController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<SupplierController> _logger;

        public SupplierController(AppDbContext db, ILogger<SupplierController> logger)
        {
            _db = db;
            _logger = logger;
        }

        // GET: api/Supplier
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool activeOnly = false)
        {
            try
            {
                var query = _db.Suppliers.AsQueryable();

                if (activeOnly)
                {
                    query = query.Where(s => s.IsActive);
                }

                var suppliers = await query
                    .OrderBy(s => s.SupplierName)
                    .ToListAsync();

                return Ok(suppliers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching suppliers");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET: api/Supplier/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var supplier = await _db.Suppliers.FindAsync(id);

                if (supplier == null)
                    return NotFound(new { message = "Supplier not found" });

                return Ok(supplier);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching supplier {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // POST: api/Supplier
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Supplier supplier)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                // Check if supplier code already exists
                if (await _db.Suppliers.AnyAsync(s => s.SupplierCode == supplier.SupplierCode))
                {
                    return BadRequest(new { message = "Supplier code already exists" });
                }

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                supplier.CreatedDate = DateTime.UtcNow;
                supplier.CreatedBy = userId;
                supplier.CompanyId = 1; // TODO: Get from user context
                supplier.IsActive = true;

                _db.Suppliers.Add(supplier);
                await _db.SaveChangesAsync();

                _logger.LogInformation("Supplier {SupplierCode} created by user {UserId}",
                    supplier.SupplierCode, userId);

                return CreatedAtAction(nameof(GetById), new { id = supplier.Id }, supplier);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating supplier");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // PUT: api/Supplier/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Supplier supplier)
        {
            if (id != supplier.Id)
                return BadRequest(new { message = "ID mismatch" });

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var existingSupplier = await _db.Suppliers.FindAsync(id);

                if (existingSupplier == null)
                    return NotFound(new { message = "Supplier not found" });

                // Check if supplier code is being changed and if it already exists
                if (existingSupplier.SupplierCode != supplier.SupplierCode &&
                    await _db.Suppliers.AnyAsync(s => s.SupplierCode == supplier.SupplierCode))
                {
                    return BadRequest(new { message = "Supplier code already exists" });
                }

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

                // Update fields
                existingSupplier.SupplierCode = supplier.SupplierCode;
                existingSupplier.SupplierName = supplier.SupplierName;
                existingSupplier.ContactPerson = supplier.ContactPerson;
                existingSupplier.Email = supplier.Email;
                existingSupplier.Phone = supplier.Phone;
                existingSupplier.Mobile = supplier.Mobile;
                existingSupplier.TaxId = supplier.TaxId;
                existingSupplier.Address = supplier.Address;
                existingSupplier.City = supplier.City;
                existingSupplier.State = supplier.State;
                existingSupplier.Country = supplier.Country;
                existingSupplier.PostalCode = supplier.PostalCode;
                existingSupplier.PaymentTerms = supplier.PaymentTerms;
                existingSupplier.SupplierType = supplier.SupplierType;
                existingSupplier.BankName = supplier.BankName;
                existingSupplier.BankAccount = supplier.BankAccount;
                existingSupplier.Notes = supplier.Notes;
                existingSupplier.ModifiedDate = DateTime.UtcNow;
                existingSupplier.ModifiedBy = userId;

                await _db.SaveChangesAsync();

                _logger.LogInformation("Supplier {Id} updated by user {UserId}", id, userId);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating supplier {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // DELETE: api/Supplier/5 (Soft delete)
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var supplier = await _db.Suppliers.FindAsync(id);

                if (supplier == null)
                    return NotFound(new { message = "Supplier not found" });

                // Check if supplier has any purchase orders
                var hasPurchaseOrders = await _db.PurchaseOrders.AnyAsync(po => po.SupplierId == id);
                if (hasPurchaseOrders)
                {
                    // Soft delete - just mark as inactive
                    supplier.IsActive = false;
                    await _db.SaveChangesAsync();

                    _logger.LogInformation("Supplier {Id} deactivated (has purchase orders)", id);

                    return Ok(new { message = "Supplier deactivated (has existing purchase orders)" });
                }

                // Hard delete if no purchase orders
                _db.Suppliers.Remove(supplier);
                await _db.SaveChangesAsync();

                _logger.LogInformation("Supplier {Id} deleted", id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting supplier {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // POST: api/Supplier/5/activate
        [HttpPost("{id}/activate")]
        public async Task<IActionResult> Activate(int id)
        {
            try
            {
                var supplier = await _db.Suppliers.FindAsync(id);

                if (supplier == null)
                    return NotFound(new { message = "Supplier not found" });

                supplier.IsActive = true;
                await _db.SaveChangesAsync();

                _logger.LogInformation("Supplier {Id} activated", id);

                return Ok(new { message = "Supplier activated" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error activating supplier {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}