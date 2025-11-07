namespace ERPSystem.Models
{
    public class Ledger
    {
        public int Id { get; set; }
        public string Description { get; set; }
        public decimal Debit { get; set; }
        public decimal Credit { get; set; }
        public DateTime TransactionDate { get; set; }
    }
}
