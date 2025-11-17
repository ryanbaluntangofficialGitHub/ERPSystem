using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ERPSystem.Services;
using System.Threading.Tasks;

namespace ERPSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UtilsController : ControllerBase
    {
        private readonly CodeGenerator _codeGenerator;

        public UtilsController(CodeGenerator codeGenerator)
        {
            _codeGenerator = codeGenerator;
        }

        [HttpGet("next-code")]
        public async Task<IActionResult> GetNextCode([FromQuery] string prefix, [FromQuery] int totalLength = 14)
        {
            if (string.IsNullOrEmpty(prefix)) return BadRequest(new { message = "prefix is required" });
            if (totalLength <= prefix.Length) return BadRequest(new { message = "totalLength must be greater than prefix length" });

            var code = await _codeGenerator.GeneratePrefixedDocumentNumberAsync(prefix, totalLength);
            return Ok(new { code });
        }

        [HttpPost("reserve")]
        public async Task<IActionResult> Reserve([FromQuery] string prefix, [FromQuery] int totalLength = 14)
        {
            if (string.IsNullOrEmpty(prefix)) return BadRequest(new { message = "prefix is required" });
            var userId = 0;
            int.TryParse(User.Identity?.Name ?? "0", out userId);
            var code = await _codeGenerator.ReservePrefixedCodeAsync(prefix, totalLength, userId == 0 ? null : userId);
            return Ok(new { code });
        }

        public class ConsumeRequest { public string Code { get; set; } = string.Empty; }

        [HttpPost("consume")]
        public async Task<IActionResult> Consume([FromBody] ConsumeRequest req)
        {
            if (req == null || string.IsNullOrEmpty(req.Code)) return BadRequest(new { message = "code is required" });
            await _codeGenerator.MarkCodeConsumedAsync(req.Code);
            return Ok();
        }
    }
}
