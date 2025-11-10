using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Models
{
    public class GoodsReceipt
    {
        public int Id { get; set; }

        [Required]
        public int CompanyId { get; set; }

        [Required]
        [StringLength(50)]
        public string GRNumber { get; set; } = string.Empty;

        [Required]
        public int PurchaseOrderId { get; set; }

        [Required]
        public DateTime ReceiptDate { get; set; }

        public int? WarehouseId { get; set; }

        [StringLength(100)]
        public string? DeliveryNote { get; set; }

        [Required]
        public int ReceivedBy { get; set; }

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Draft"; // Draft, PendingApproval, Approved, Posted

        public int? ApprovedBy { get; set; }
        public DateTime? ApprovalDate { get; set; }

        public string? Notes { get; set; }

        public DateTime CreatedDate { get; set; }
        public int CreatedBy { get; set; }

        // Navigation properties
        public virtual PurchaseOrder PurchaseOrder { get; set; } = null!;
        public virtual Warehouse? Warehouse { get; set; }
        public virtual ICollection<GoodsReceiptItem> Items { get; set; } = new List<GoodsReceiptItem>();
    }

    public class GoodsReceiptItem
    {
        public int Id { get; set; }

        [Required]
        public int GoodsReceiptId { get; set; }

        [Required]
        public int PurchaseOrderItemId { get; set; }

        [Required]
        public int ProductId { get; set; }

        [Required]
        public decimal OrderedQuantity { get; set; }

        [Required]
        public decimal ReceivedQuantity { get; set; }

        public decimal RejectedQuantity { get; set; }

        [Required]
        public decimal UnitPrice { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        // Navigation properties
        public virtual GoodsReceipt GoodsReceipt { get; set; } = null!;
        public virtual PurchaseOrderItem PurchaseOrderItem { get; set; } = null!;
        public virtual Product Product { get; set; } = null!;
    }
}