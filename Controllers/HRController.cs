using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERPSystem.Data;
using ERPSystem.Models;

namespace ERPSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HRController : ControllerBase
    {
        private readonly AppDbContext _db;
        public HRController(AppDbContext db) { _db = db; }

        [HttpGet] public async Task<IActionResult> Get() => Ok(await _db.Employees.ToListAsync());
    }
}
