using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ERPSystem.DTOs
{
    public class ConvertPRToPODto
    {
        [Required(ErrorMessage = "SupplierId is required")]
        public int SupplierId { get; set; }

        [Required(ErrorMessage = "At least one item is required")]
        [MinLength(1, ErrorMessage = "At least one item is required")]
        public List<ConvertPRToPOItemDto> Items { get; set; } = new();
    }

    public class ConvertPRToPOItemDto
    {
        public int? ProductId { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
        public int Quantity { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "UnitPrice must be non-negative")]
        public decimal UnitPrice { get; set; }
    }
}