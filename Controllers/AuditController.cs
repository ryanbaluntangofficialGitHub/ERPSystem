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
    public class AuditController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<AuditController> _logger;

        public AuditController(AppDbContext db, ILogger<AuditController> logger)
        {
            _db = db;
            _logger = logger;
        }

        // GET: api/Audit?page=1&pageSize=20
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0 || pageSize > 500) pageSize = 50;

            try
            {
                var q = _db.AuditLogs.AsQueryable();
                var total = await q.CountAsync();
                var items = await q.OrderByDescending(a => a.CreatedDate)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return Ok(new { Items = items, Total = total, Page = page, PageSize = pageSize });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching audit logs");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET: api/Audit/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            try
            {
                var item = await _db.AuditLogs.FindAsync(id);
                if (item == null) return NotFound(new { message = "Audit log not found" });
                return Ok(item);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching audit log {Id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}
