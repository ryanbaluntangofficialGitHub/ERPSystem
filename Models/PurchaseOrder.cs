using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Models
{
    public class PurchaseOrder
    {
        public int Id { get; set; }

        [Required]
        public int CompanyId { get; set; }

        [Required]
        [StringLength(50)]
        public string PONumber { get; set; } = string.Empty;

        public int? PurchaseRequestId { get; set; }
        public int? CanvassingId { get; set; }

        [Required]
        public int SupplierId { get; set; }

        [Required]
        public DateTime OrderDate { get; set; }

        public DateTime? RequiredDate { get; set; }

        [Required]
        public decimal SubTotal { get; set; }

        public decimal TaxAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal ShippingAmount { get; set; }

        [Required]
        public decimal TotalAmount { get; set; }

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Draft"; // Draft, PendingApproval, Approved, Sent, Confirmed, PartiallyReceived, Received, Cancelled

        public int? ApprovedBy { get; set; }
        public DateTime? ApprovalDate { get; set; }
        public DateTime? SentDate { get; set; }
        public DateTime? ConfirmedDate { get; set; }

        [StringLength(500)]
        public string? ShippingAddress { get; set; }

        public string? Notes { get; set; }

        public DateTime CreatedDate { get; set; }
        public int CreatedBy { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public int? ModifiedBy { get; set; }

        // Navigation properties
        public virtual Supplier Supplier { get; set; } = null!;
        public virtual PurchaseRequest? PurchaseRequest { get; set; }
        public virtual Canvassing? Canvassing { get; set; }
        public virtual ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();
        public virtual ICollection<GoodsReceipt> GoodsReceipts { get; set; } = new List<GoodsReceipt>();
    }

    public class PurchaseOrderItem
    {
        public int Id { get; set; }

        [Required]
        public int PurchaseOrderId { get; set; }

        [Required]
        public int ProductId { get; set; }

        [Required]
        public decimal Quantity { get; set; }

        public decimal ReceivedQuantity { get; set; }

        [Required]
        public decimal UnitPrice { get; set; }

        public decimal DiscountPercent { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TaxPercent { get; set; }
        public decimal TaxAmount { get; set; }

        [Required]
        public decimal LineTotal { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        // Navigation properties
        public virtual PurchaseOrder PurchaseOrder { get; set; } = null!;
        public virtual Product Product { get; set; } = null!;
    }
}