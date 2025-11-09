using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ERPSystem.Data;
using ERPSystem.Models;

namespace ERPSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(AppDbContext context, IConfiguration configuration, ILogger<AuthController> logger)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Login endpoint - authenticates user and returns JWT token
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            {
                _logger.LogWarning("Login attempt with missing credentials from IP: {IP}",
                    HttpContext.Connection.RemoteIpAddress);
                return BadRequest(new { message = "Username and password are required." });
            }

            // Find user by username
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Username == request.Username);

            // Check if user exists and verify password using BCrypt
            if (user == null || !DbInitializer.VerifyPassword(request.Password, user.PasswordHash))
            {
                _logger.LogWarning("Failed login attempt for username: {Username} from IP: {IP}",
                    request.Username, HttpContext.Connection.RemoteIpAddress);

                // Return generic error message for security (don't reveal if username exists)
                return Unauthorized(new { message = "Invalid username or password" });
            }

            _logger.LogInformation("User {Username} logged in successfully with role {Role}",
                user.Username, user.Role?.Name);

            // Generate JWT token
            var token = GenerateJwtToken(user);
            var expirationHours = _configuration.GetValue<int>("JwtSettings:ExpirationHours", 3);

            return Ok(new
            {
                Token = token,
                Username = user.Username,
                Role = user.Role?.Name,
                ExpiresIn = expirationHours * 3600 // Convert hours to seconds
            });
        }

        /// <summary>
        /// Generate JWT token for authenticated user
        /// </summary>
        private string GenerateJwtToken(User user)
        {
            var roleName = user.Role?.Name ?? "User";
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = Encoding.ASCII.GetBytes(jwtSettings["Key"] ?? throw new InvalidOperationException("JWT Key is not configured"));
            var expirationHours = jwtSettings.GetValue<int>("ExpirationHours", 3);

            var tokenHandler = new JwtSecurityTokenHandler();

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(ClaimTypes.Role, roleName),
                    new Claim("UserId", user.Id.ToString())
                }),
                Expires = DateTime.UtcNow.AddHours(expirationHours),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature
                ),
                Issuer = jwtSettings["Issuer"],
                Audience = jwtSettings["Audience"]
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        /// <summary>
        /// Validate current JWT token
        /// </summary>
        [HttpPost("validate")]
        [Authorize]
        public IActionResult ValidateToken()
        {
            var username = User.Identity?.Name;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            var userId = User.FindFirst("UserId")?.Value;

            if (string.IsNullOrEmpty(username))
                return Unauthorized(new { message = "Invalid token" });

            return Ok(new
            {
                Username = username,
                Role = role,
                UserId = userId,
                IsValid = true
            });
        }

        /// <summary>
        /// Change password for currently logged-in user
        /// </summary>
        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
                string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new { message = "Current and new passwords are required" });
            }

            // Get current user
            var username = User.Identity?.Name;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);

            if (user == null)
                return NotFound(new { message = "User not found" });

            // Verify current password
            if (!DbInitializer.VerifyPassword(request.CurrentPassword, user.PasswordHash))
            {
                _logger.LogWarning("Failed password change attempt for user: {Username}", username);
                return BadRequest(new { message = "Current password is incorrect" });
            }

            // Validate new password strength
            if (request.NewPassword.Length < 8)
            {
                return BadRequest(new { message = "New password must be at least 8 characters long" });
            }

            // Hash and save new password
            user.PasswordHash = DbInitializer.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Password changed successfully for user: {Username}", username);

            return Ok(new { message = "Password changed successfully" });
        }

        /// <summary>
        /// Register new user (Admin only)
        /// </summary>
        [HttpPost("register")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(request.Username) ||
                string.IsNullOrWhiteSpace(request.Password) ||
                string.IsNullOrWhiteSpace(request.RoleName))
            {
                return BadRequest(new { message = "Username, password, and role are required" });
            }

            // Check if username already exists
            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            {
                return BadRequest(new { message = "Username already exists" });
            }

            // Validate password strength
            if (request.Password.Length < 8)
            {
                return BadRequest(new { message = "Password must be at least 8 characters long" });
            }

            // Find the role
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == request.RoleName);
            if (role == null)
            {
                return BadRequest(new { message = $"Invalid role: {request.RoleName}. Valid roles are: Admin, Sales, Purchase, HR, Accounting, Production" });
            }

            // Create new user with hashed password
            var user = new User
            {
                Username = request.Username,
                PasswordHash = DbInitializer.HashPassword(request.Password),
                RoleId = role.Id
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("New user created: {Username} with role {Role} by {Admin}",
                user.Username, role.Name, User.Identity?.Name);

            return Ok(new
            {
                message = "User created successfully",
                username = user.Username,
                role = role.Name
            });
        }

        /// <summary>
        /// Get list of all users (Admin only)
        /// </summary>
        [HttpGet("users")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .Include(u => u.Role)
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    Role = u.Role.Name
                })
                .ToListAsync();

            return Ok(users);
        }

        /// <summary>
        /// Get available roles (Admin only)
        /// </summary>
        [HttpGet("roles")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _context.Roles
                .Select(r => new { r.Id, r.Name })
                .ToListAsync();

            return Ok(roles);
        }

        /// <summary>
        /// Delete user (Admin only)
        /// </summary>
        [HttpDelete("users/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound(new { message = "User not found" });

            // Prevent deleting yourself
            var currentUsername = User.Identity?.Name;
            if (user.Username == currentUsername)
            {
                return BadRequest(new { message = "You cannot delete your own account" });
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User {Username} deleted by {Admin}",
                user.Username, currentUsername);

            return Ok(new { message = "User deleted successfully" });
        }

        /// <summary>
        /// Reset user password (Admin only)
        /// </summary>
        [HttpPost("reset-password")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) ||
                string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new { message = "Username and new password are required" });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);

            if (user == null)
                return NotFound(new { message = "User not found" });

            // Validate password strength
            if (request.NewPassword.Length < 8)
            {
                return BadRequest(new { message = "Password must be at least 8 characters long" });
            }

            // Hash and save new password
            user.PasswordHash = DbInitializer.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Password reset for user {Username} by admin {Admin}",
                user.Username, User.Identity?.Name);

            return Ok(new { message = "Password reset successfully" });
        }

        /// <summary>
        /// Update user role (Admin only)
        /// </summary>
        [HttpPut("users/{id}/role")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUserRole(int id, [FromBody] UpdateRoleRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.RoleName))
            {
                return BadRequest(new { message = "Role name is required" });
            }

            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
                return NotFound(new { message = "User not found" });

            var newRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == request.RoleName);

            if (newRole == null)
            {
                return BadRequest(new { message = $"Invalid role: {request.RoleName}" });
            }

            var oldRole = user.Role?.Name;
            user.RoleId = newRole.Id;
            await _context.SaveChangesAsync();

            _logger.LogInformation("User {Username} role changed from {OldRole} to {NewRole} by {Admin}",
                user.Username, oldRole, newRole.Name, User.Identity?.Name);

            return Ok(new
            {
                message = "User role updated successfully",
                username = user.Username,
                oldRole,
                newRole = newRole.Name
            });
        }
    }

    #region Request Models

    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class RegisterRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
    }

    public class ResetPasswordRequest
    {
        public string Username { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class UpdateRoleRequest
    {
        public string RoleName { get; set; } = string.Empty;
    }

    #endregion
}