using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERPSystem.Data;
using ERPSystem.Models;

namespace ERPSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountingController : ControllerBase
    {
        private readonly AppDbContext _db;
        public AccountingController(AppDbContext db) { _db = db; }

        [HttpGet] public async Task<IActionResult> Get() => Ok(await _db.Expenses.ToListAsync());
    }
}
