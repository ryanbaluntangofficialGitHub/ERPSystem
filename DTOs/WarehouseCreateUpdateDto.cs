using System.ComponentModel.DataAnnotations;

namespace ERPSystem.DTOs
{
    public class WarehouseCreateUpdateDto
    {
        [Required]
        public int CompanyId { get; set; }

        [Required]
        [StringLength(50)]
        public string WarehouseCode { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string WarehouseName { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Address { get; set; }

        [StringLength(100)]
        public string? City { get; set; }

        [StringLength(100)]
        public string? State { get; set; }

        [StringLength(100)]
        public string? Country { get; set; }

        [StringLength(20)]
        public string? PostalCode { get; set; }

        public int? ManagerId { get; set; }

        public bool IsActive { get; set; } = true;
    }
}