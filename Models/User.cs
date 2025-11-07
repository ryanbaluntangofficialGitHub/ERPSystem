using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Models
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        public string Username { get; set; } = null!;

        [Required]
        public string PasswordHash { get; set; } = null!;  // <-- add this

        [Required]
        public int RoleId { get; set; }
        public Role Role { get; set; } = null!;
    }
}
