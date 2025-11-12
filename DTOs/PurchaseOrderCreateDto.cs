using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace ERPSystem.DTOs
{
    public class PurchaseOrderCreateDto
    {
        public int Id { get; set; }

        [Required]
        public int CompanyId { get; set; }

        public int? PurchaseRequestId { get; set; }
        public int? CanvassingId { get; set; }

        [Required]
        public int SupplierId { get; set; }

        public DateTime? RequiredDate { get; set; }

        public string? ShippingAddress { get; set; }
        public string? Notes { get; set; }

        [Required]
        public List<PurchaseOrderItemCreateDto> Items { get; set; } = new();
    }

    public class PurchaseOrderItemCreateDto
    {
        public int ProductId { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal LineTotal { get; set; }
    }
}