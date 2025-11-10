using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Models
{
    public class EmailLog
    {
        public int Id { get; set; }

        [Required]
        public int CompanyId { get; set; }

        [Required]
        [StringLength(50)]
        public string ReferenceType { get; set; } = string.Empty; // PurchaseOrder, Invoice, etc.

        [Required]
        public int ReferenceId { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string RecipientEmail { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string Subject { get; set; } = string.Empty;

        public string Body { get; set; } = string.Empty;

        [Required]
        public DateTime SentDate { get; set; }

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Sent"; // Sent, Failed

        public string? ErrorMessage { get; set; }

        [Required]
        public int SentBy { get; set; }
    }
}