using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Models
{
    public class Department
    {
        public int Id { get; set; }

        [Required]
        public int CompanyId { get; set; }

        [Required]
        [StringLength(100)]
        public string DepartmentName { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        public int? ManagerId { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedDate { get; set; }

        // Navigation properties
        public virtual Employee? Manager { get; set; }
    }
}