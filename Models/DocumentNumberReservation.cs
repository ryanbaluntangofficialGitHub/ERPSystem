using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Models
{
    public class DocumentNumberReservation
    {
        public int Id { get; set; }

        [Required]
        [StringLength(10)]
        public string Prefix { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Code { get; set; } = string.Empty;

        public DateTime ReservedAt { get; set; }

        public int? ReservedBy { get; set; }

        public bool IsConsumed { get; set; }

        public DateTime? ConsumedAt { get; set; }
    }
}
