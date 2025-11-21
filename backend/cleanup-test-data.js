/**
 * Cleanup Test Data
 * Removes all test data from the database to allow fresh test runs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║     Cleaning Test Data from Database  ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    const companyId = '8c269937-32c1-41dd-bd00-98eeb42836bb';

    console.log('🗑️  Deleting test data for company:', companyId);

    // Delete in reverse order of dependencies
    console.log('  → Deleting stock movements...');
    const movements = await prisma.stockMovement.deleteMany({
      where: { companyId }
    });
    console.log(`    ✓ Deleted ${movements.count} stock movements`);

    console.log('  → Deleting stock...');
    const stock = await prisma.stock.deleteMany({
      where: { companyId }
    });
    console.log(`    ✓ Deleted ${stock.count} stock entries`);

    // Delete purchase/sales cycle items first
    console.log('  → Deleting goods receipt items...');
    const grItems = await prisma.goodsReceiptItem.deleteMany({
      where: { receipt: { companyId } }
    });
    console.log(`    ✓ Deleted ${grItems.count} goods receipt items`);

    console.log('  → Deleting goods receipts...');
    const receipts = await prisma.goodsReceipt.deleteMany({
      where: { companyId }
    });
    console.log(`    ✓ Deleted ${receipts.count} goods receipts`);

    console.log('  → Deleting purchase order items...');
    const poItems = await prisma.purchaseOrderItem.deleteMany({
      where: { order: { companyId } }
    });
    console.log(`    ✓ Deleted ${poItems.count} purchase order items`);

    console.log('  → Deleting purchase orders...');
    const pos = await prisma.purchaseOrder.deleteMany({
      where: { companyId }
    });
    console.log(`    ✓ Deleted ${pos.count} purchase orders`);

    // Delete bill items and bills
    console.log('  → Deleting bill items...');
    const billItems = await prisma.billItem.deleteMany({
      where: { bill: { companyId } }
    });
    console.log(`    ✓ Deleted ${billItems.count} bill items`);

    console.log('  → Deleting bills...');
    const bills = await prisma.bill.deleteMany({
      where: { companyId }
    });
    console.log(`    ✓ Deleted ${bills.count} bills`);

    console.log('  → Deleting products...');
    const products = await prisma.product.deleteMany({
      where: { companyId }
    });
    console.log(`    ✓ Deleted ${products.count} products`);

    console.log('  → Deleting categories...');
    const categories = await prisma.category.deleteMany({
      where: { companyId }
    });
    console.log(`    ✓ Deleted ${categories.count} categories`);

    console.log('  → Deleting brands...');
    const brands = await prisma.brand.deleteMany({
      where: { companyId }
    });
    console.log(`    ✓ Deleted ${brands.count} brands`);

    console.log('  → Deleting warehouses...');
    const warehouses = await prisma.warehouse.deleteMany({
      where: { companyId }
    });
    console.log(`    ✓ Deleted ${warehouses.count} warehouses`);

    console.log('  → Deleting vendors...');
    const vendors = await prisma.vendor.deleteMany({
      where: { companyId }
    });
    console.log(`    ✓ Deleted ${vendors.count} vendors`);

    console.log('  → Deleting customers...');
    const customers = await prisma.customer.deleteMany({
      where: { companyId }
    });
    console.log(`    ✓ Deleted ${customers.count} customers`);

    console.log('\n✅ Database cleanup completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Error cleaning database:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
