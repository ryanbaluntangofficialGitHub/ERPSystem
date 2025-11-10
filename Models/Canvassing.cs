using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Models
{
    public class Canvassing
    {
        public int Id { get; set; }

        [Required]
        public int CompanyId { get; set; }

        [Required]
        [StringLength(50)]
        public string CanvassingNumber { get; set; } = string.Empty;

        public int? PurchaseRequestId { get; set; }

        [Required]
        public DateTime CanvassingDate { get; set; }

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "InProgress"; // InProgress, Completed, Cancelled

        public int? SelectedSupplierId { get; set; }
        public string? Notes { get; set; }

        public DateTime CreatedDate { get; set; }
        public int CreatedBy { get; set; }

        // Navigation properties
        public virtual PurchaseRequest? PurchaseRequest { get; set; }
        public virtual Supplier? SelectedSupplier { get; set; }
        public virtual ICollection<CanvassingItem> Items { get; set; } = new List<CanvassingItem>();
    }

    public class CanvassingItem
    {
        public int Id { get; set; }

        [Required]
        public int CanvassingId { get; set; }

        [Required]
        public int SupplierId { get; set; }

        public int? ProductId { get; set; }

        [Required]
        public decimal Quantity { get; set; }

        [Required]
        public decimal UnitPrice { get; set; }

        [Required]
        public decimal TotalPrice { get; set; }

        public int? DeliveryDays { get; set; }
        public int? PaymentTerms { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        public bool IsSelected { get; set; }

        // Navigation properties
        public virtual Canvassing Canvassing { get; set; } = null!;
        public virtual Supplier Supplier { get; set; } = null!;
        public virtual Product? Product { get; set; }
    }
}