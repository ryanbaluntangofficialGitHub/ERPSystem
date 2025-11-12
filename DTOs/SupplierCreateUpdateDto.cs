using System.ComponentModel.DataAnnotations;

namespace ERPSystem.DTOs
{
    public class SupplierCreateUpdateDto
    {
        [Required]
        [StringLength(50)]
        public string SupplierCode { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string SupplierName { get; set; } = string.Empty;

        [StringLength(200)]
        public string? ContactPerson { get; set; }

        [EmailAddress]
        [StringLength(100)]
        public string? Email { get; set; }

        [Phone]
        [StringLength(50)]
        public string? Phone { get; set; }

        [Phone]
        [StringLength(50)]
        public string? Mobile { get; set; }

        [StringLength(50)]
        public string? TaxId { get; set; }

        [StringLength(500)]
        public string? Address { get; set; }

        [StringLength(100)]
        public string? City { get; set; }

        [StringLength(100)]
        public string? State { get; set; }

        [StringLength(100)]
        public string? Country { get; set; }

        [StringLength(20)]
        public string? PostalCode { get; set; }

        public int PaymentTerms { get; set; } = 30; // Days

        [StringLength(50)]
        public string SupplierType { get; set; } = "Material";

        [StringLength(100)]
        public string? BankName { get; set; }

        [StringLength(100)]
        public string? BankAccount { get; set; }

        public string? Notes { get; set; }

        public bool IsActive { get; set; } = true;
    }
}