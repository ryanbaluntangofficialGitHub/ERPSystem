using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Models
{
    public class AuditLog
    {
        public int Id { get; set; }

        [Required]
        public int CompanyId { get; set; }

        public int UserId { get; set; }

        [Required]
        [StringLength(100)]
        public string Action { get; set; } = string.Empty; // e.g., Create, Update, Delete, Approve

        [Required]
        [StringLength(100)]
        public string Entity { get; set; } = string.Empty; // e.g., Warehouse, PurchaseOrder

        public int? EntityId { get; set; }

        [StringLength(2000)]
        public string? Details { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }
}