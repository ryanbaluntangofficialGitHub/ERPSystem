using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using ERPSystem.Data;
using ERPSystem.Models;
using ERPSystem.Controllers;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.AspNetCore.Mvc;
using ERPSystem.DTOs;

namespace ERPSystem.Tests
{
    public class EmployeeControllerTests : IDisposable
    {
        private readonly AppDbContext _db;
        private readonly EmployeeController _controller;

        public EmployeeControllerTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _db = new AppDbContext(options);

            // Seed departments
            var dept = new Department { Id = 1, DepartmentName = "IT", CompanyId = 1, CreatedDate = DateTime.UtcNow };
            _db.Departments.Add(dept);
            _db.SaveChanges();

            _controller = new EmployeeController(_db, new NullLogger<EmployeeController>());
        }

        [Fact]
        public async Task CreateEmployee_ReturnsCreated()
        {
            var dto = new EmployeeCreateUpdateDto
            {
                CompanyId = 1,
                EmployeeCode = "E001",
                Name = "John Doe",
                Position = "Dev",
                Department = "IT",
                DepartmentId = 1,
                Email = "john@example.com",
                Phone = "123",
                HireDate = DateTime.UtcNow
            };

            var result = await _controller.Create(dto) as CreatedAtActionResult;
            Assert.NotNull(result);
            var created = result.Value as EmployeeDto;
            Assert.NotNull(created);
            Assert.Equal(dto.EmployeeCode, created.EmployeeCode);
        }

        public void Dispose()
        {
            _db.Dispose();
        }
    }
}