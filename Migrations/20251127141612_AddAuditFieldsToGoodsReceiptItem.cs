using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERPSystem.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditFieldsToGoodsReceiptItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ModifiedBy",
                table: "GoodsReceipts",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedDate",
                table: "GoodsReceipts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "GoodsReceiptItems",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedDate",
                table: "GoodsReceiptItems",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "ModifiedBy",
                table: "GoodsReceiptItems",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedDate",
                table: "GoodsReceiptItems",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ModifiedBy",
                table: "GoodsReceipts");

            migrationBuilder.DropColumn(
                name: "ModifiedDate",
                table: "GoodsReceipts");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "GoodsReceiptItems");

            migrationBuilder.DropColumn(
                name: "CreatedDate",
                table: "GoodsReceiptItems");

            migrationBuilder.DropColumn(
                name: "ModifiedBy",
                table: "GoodsReceiptItems");

            migrationBuilder.DropColumn(
                name: "ModifiedDate",
                table: "GoodsReceiptItems");
        }
    }
}
