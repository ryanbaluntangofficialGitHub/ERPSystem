using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace ERPSystem.Models
{
    public class Invoice
    {
        public int Id { get; set; }
        public int CompanyId { get; set; }
        public string? InvoiceNumber { get; set; }
        public int? PurchaseOrderId { get; set; }
        public int SupplierId { get; set; }
        public DateTime InvoiceDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = "Draft";

        public DateTime CreatedDate { get; set; }
        public int CreatedBy { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ApprovedDate { get; set; }

        // Navigation
        public virtual Supplier? Supplier { get; set; }
        public virtual PurchaseOrder? PurchaseOrder { get; set; }
        public virtual ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
    }
}
