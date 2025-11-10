using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Models
{
    public class Supplier
    {
        public int Id { get; set; }

        [Required]
        public int CompanyId { get; set; }

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
        public string SupplierType { get; set; } = "Material"; // Material, Service, Both

        [StringLength(100)]
        public string? BankName { get; set; }

        [StringLength(100)]
        public string? BankAccount { get; set; }

        public bool IsActive { get; set; } = true;

        public string? Notes { get; set; }

        public DateTime CreatedDate { get; set; }
        public int CreatedBy { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public int? ModifiedBy { get; set; }
    }
}