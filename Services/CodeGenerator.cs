using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using ERPSystem.Data;
using Microsoft.EntityFrameworkCore;

namespace ERPSystem.Services
{
    // Utility to generate unique numeric codes of a given length
    public class CodeGenerator
    {
        private readonly AppDbContext _db;
        private readonly RandomNumberGenerator _rng = RandomNumberGenerator.Create();

        public CodeGenerator(AppDbContext db)
        {
            _db = db;
        }

        public async Task<string> GenerateNumericCodeAsync(int length, int maxAttempts = 20)
        {
            if (length <= 0) throw new ArgumentException("length must be > 0", nameof(length));

            for (int attempt = 0; attempt < maxAttempts; attempt++)
            {
                var code = GenerateRandomNumericString(length);

                // check uniqueness across PR/PO numbers
                var existsPr = await _db.PurchaseRequests.AnyAsync(p => p.RequestNumber == code);
                if (existsPr) continue;
                var existsPo = await _db.PurchaseOrders.AnyAsync(po => po.PONumber == code);
                if (existsPo) continue;

                return code;
            }

            // fallback to timestamp-based code if collisions
            var ts = DateTime.UtcNow.Ticks.ToString();
            if (ts.Length > length) ts = ts.Substring(ts.Length - length);
            return ts.PadLeft(length, '0');
        }

        public async Task<string> GeneratePrefixedDocumentNumberAsync(string prefix, int totalLength)
        {
            if (prefix == null) prefix = string.Empty;
            var numericLength = Math.Max(1, totalLength - prefix.Length);
            var numeric = await GenerateNumericCodeAsync(numericLength);
            return prefix + numeric;
        }

        private string GenerateRandomNumericString(int length)
        {
            // generate length bytes and map to digits
            var bytes = new byte[length];
            _rng.GetBytes(bytes);
            var sb = new StringBuilder(length);
            foreach (var b in bytes)
            {
                // map byte to 0-9
                sb.Append((b % 10).ToString());
            }
            return sb.ToString();
        }

        // New: Reserve a code so UI can display it before creation.
        public async Task<string> ReservePrefixedCodeAsync(string prefix, int totalLength, int? reservedBy = null)
        {
            var code = await GeneratePrefixedDocumentNumberAsync(prefix, totalLength);

            var reservation = new Models.DocumentNumberReservation
            {
                Prefix = prefix,
                Code = code,
                ReservedAt = DateTime.UtcNow,
                ReservedBy = reservedBy,
                IsConsumed = false
            };

            _db.Add(reservation);
            await _db.SaveChangesAsync();

            return code;
        }

        public async Task MarkCodeConsumedAsync(string code)
        {
            var res = await _db.Set<Models.DocumentNumberReservation>().FirstOrDefaultAsync(r => r.Code == code && !r.IsConsumed);
            if (res != null)
            {
                res.IsConsumed = true;
                res.ConsumedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
        }
    }
}
