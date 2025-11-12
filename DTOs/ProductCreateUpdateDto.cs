using System.ComponentModel.DataAnnotations;

namespace ERPSystem.DTOs
{
    public class ProductCreateUpdateDto
    {
        [Required]
        public int CompanyId { get; set; }

        [Required]
        [StringLength(50)]
        public string ProductCode { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [StringLength(50)]
        public string UnitOfMeasure { get; set; } = "pcs";

        public decimal Price { get; set; }

        public int Quantity { get; set; }

        public bool IsActive { get; set; } = true;
    }
}