using System.Collections.Generic;

namespace ERPSystem.DTOs
{
    public class ConvertPRToPODto
    {
        public int SupplierId { get; set; }
        public List<ConvertPRToPOItemDto> Items { get; set; } = new();
    }

    public class ConvertPRToPOItemDto
    {
        public int? ProductId { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
}