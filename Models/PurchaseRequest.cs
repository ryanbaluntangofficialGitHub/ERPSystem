using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Models
{
    public class PurchaseRequest
    {
        public int Id { get; set; }

        [Required]
        public int CompanyId { get; set; }

        [Required]
        [StringLength(50)]
        public string RequestNumber { get; set; } = string.Empty;

        [Required]
        public DateTime RequestDate { get; set; }

        public int? DepartmentId { get; set; }

        [StringLength(50)]
        public string? Priority { get; set; } = "Normal";

        public DateTime? RequiredDate { get; set; }

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Draft"; // Draft, PendingApproval, Approved, Rejected, Converted

        public int RequestedBy { get; set; }

        public int? ApprovedBy { get; set; }
        public DateTime? ApprovalDate { get; set; }

        [StringLength(500)]
        public string? RejectionReason { get; set; }

        public string? Notes { get; set; }

        public DateTime CreatedDate { get; set; }
        public int CreatedBy { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public int? ModifiedBy { get; set; }

        // Navigation properties
        public virtual Department? Department { get; set; }
        public virtual ICollection<PurchaseRequestItem> Items { get; set; } = new List<PurchaseRequestItem>();
    }

    public class PurchaseRequestItem
    {
        public int Id { get; set; }

        [Required]
        public int PurchaseRequestId { get; set; }

        public int? ProductId { get; set; }

        [Required]
        public decimal Quantity { get; set; }

        public decimal EstimatedPrice { get; set; }

        [StringLength(50)]
        public string? UnitOfMeasure { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        [StringLength(500)]
        public string? Description { get; set; } // Added to match seed data

        [StringLength(500)]
        public string? Purpose { get; set; } // Added to match seed data

        // Navigation properties
        public virtual PurchaseRequest PurchaseRequest { get; set; } = null!;
        public virtual Product? Product { get; set; }
    }
}