using System.ComponentModel.DataAnnotations;

namespace ERPSystem.DTOs
{
    public class EmployeeCreateUpdateDto
    {
        [Required]
        public int CompanyId { get; set; }

        [Required]
        [StringLength(50)]
        public string EmployeeCode { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Position { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Department { get; set; } = string.Empty;

        public int? DepartmentId { get; set; }

        [EmailAddress]
        [StringLength(100)]
        public string? Email { get; set; }

        [Phone]
        [StringLength(20)]
        public string? Phone { get; set; }

        public DateTime HireDate { get; set; }

        public bool IsActive { get; set; } = true;
    }
}