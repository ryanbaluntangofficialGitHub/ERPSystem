using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Models
{
    public class SalesOrder
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Customer name is required")]
        [StringLength(200, ErrorMessage = "Customer name cannot exceed 200 characters")]
        public string CustomerName { get; set; } = string.Empty;

        [Required]
        public DateTime SaleDate { get; set; }

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Total amount must be greater than 0")]
        public decimal TotalAmount { get; set; }
    }
}