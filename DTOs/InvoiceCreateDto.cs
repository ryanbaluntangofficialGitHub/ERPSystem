using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace ERPSystem.DTOs
{
    public class InvoiceCreateDto
    {
        public int Id { get; set; }
        [Required]
        public int CompanyId { get; set; }
        public int? PurchaseOrderId { get; set; }
        [Required]
        public int SupplierId { get; set; }
        public string? InvoiceNumber { get; set; }
        public DateTime? InvoiceDate { get; set; }
        public decimal TotalAmount { get; set; }
        public List<InvoiceItemCreateDto> Items { get; set; } = new();
    }

    public class InvoiceItemCreateDto
    {
        public int ProductId { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal LineTotal { get; set; }
    }
}
