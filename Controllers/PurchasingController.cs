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

        // This controller is now mainly for backward compatibility
        // Use PurchaseOrderController for the new workflow

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            try
            {
                var orders = await _db.PurchaseOrders
                    .Include(po => po.Supplier)
                    .OrderByDescending(po => po.OrderDate)
                    .ToListAsync();
                return Ok(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching purchase orders");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}