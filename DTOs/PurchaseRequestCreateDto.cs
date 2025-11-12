using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace ERPSystem.DTOs
{
    public class PurchaseRequestCreateDto
    {
        public int Id { get; set; }

        [Required]
        public int CompanyId { get; set; }

        public int? DepartmentId { get; set; }

        public string? Priority { get; set; }

        public DateTime? RequiredDate { get; set; }

        public string? Notes { get; set; }

        [Required]
        public List<PurchaseRequestItemDto> Items { get; set; } = new();
    }

    public class PurchaseRequestItemDto
    {
        public int? ProductId { get; set; }
        public string? Description { get; set; }
        public decimal Quantity { get; set; }
        public decimal EstimatedPrice { get; set; }
        public string? UnitOfMeasure { get; set; }
        public string? Purpose { get; set; }
    }
}