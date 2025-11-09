using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Models
{
    public class PurchaseOrder
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Supplier name is required")]
        [StringLength(200, ErrorMessage = "Supplier name cannot exceed 200 characters")]
        public string Supplier { get; set; } = string.Empty;

        [Required]
        public DateTime Date { get; set; }

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Total must be greater than 0")]
        public decimal Total { get; set; }
    }
}