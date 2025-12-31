// ================================================
// AUTO INVOICE GENERATOR - Generate Monthly Invoices
// ================================================

const generateMonthlyInvoices = async (pool) => {
  console.log('🔄 Checking for subscriptions needing new invoices...');
  
  try {
    // 1. Find active subscriptions with next_due_date <= TODAY
    const subscriptionsNeedingInvoice = await pool.query(`
      SELECT 
        s.id AS subscription_id,
        s.customer_id,
        s.package_id,
        s.payment_due_day,
        s.next_due_date,
        c.name AS customer_name,
        p.price AS package_price,
        p.name AS package_name
      FROM subscriptions s
      JOIN customers c ON s.customer_id = c.id
      JOIN packages p ON s.package_id = p.id
      WHERE s.status = 'active'
        AND s.next_due_date <= CURRENT_DATE
        AND c.status = 'active'
    `);

    if (subscriptionsNeedingInvoice.rows.length === 0) {
      console.log('✅ No new invoices needed');
      return { generated: 0 };
    }

    console.log(`📋 Found ${subscriptionsNeedingInvoice.rows.length} subscriptions needing invoices`);

    let generatedCount = 0;

    for (const sub of subscriptionsNeedingInvoice.rows) {
      try {
        // 2. Generate invoice number
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const customerId = String(sub.customer_id).padStart(5, '0');
        const invoiceNumber = `INV-${year}${month}-${customerId}`;

        // 3. Check if invoice already exists
        const existingInvoice = await pool.query(
          'SELECT id FROM invoices WHERE invoice_number = $1',
          [invoiceNumber]
        );

        if (existingInvoice.rows.length > 0) {
          console.log(`⏭️  Invoice ${invoiceNumber} already exists, skipping`);
          continue;
        }

        // 4. Create invoice
        await pool.query(`
          INSERT INTO invoices (
            customer_id, 
            subscription_id, 
            invoice_number, 
            amount, 
            due_date, 
            status
          ) VALUES ($1, $2, $3, $4, $5, 'unpaid')
        `, [
          sub.customer_id,
          sub.subscription_id,
          invoiceNumber,
          sub.package_price,
          sub.next_due_date
        ]);

        // 5. Calculate next_due_date (1 month later)
        const currentDueDate = new Date(sub.next_due_date);
        let nextMonth = currentDueDate.getMonth() + 1;
        let nextYear = currentDueDate.getFullYear();
        
        if (nextMonth > 11) {
          nextMonth = 0;
          nextYear++;
        }

        const nextDueDate = new Date(nextYear, nextMonth, sub.payment_due_day);
        
        // Handle month overflow (e.g., Jan 31 → Feb 28/29)
        if (nextDueDate.getMonth() !== nextMonth) {
          nextDueDate.setDate(0); // Last day of previous month
        }

        // 6. Update subscription's next_due_date
        await pool.query(
          'UPDATE subscriptions SET next_due_date = $1 WHERE id = $2',
          [nextDueDate.toISOString().split('T')[0], sub.subscription_id]
        );

        console.log(`✅ Generated invoice ${invoiceNumber} for ${sub.customer_name} (Due: ${sub.next_due_date})`);
        generatedCount++;

      } catch (error) {
        console.error(`❌ Error generating invoice for subscription ${sub.subscription_id}:`, error);
      }
    }

    console.log(`🎉 Successfully generated ${generatedCount} invoices`);
    return { generated: generatedCount };

  } catch (error) {
    console.error('❌ Error in generateMonthlyInvoices:', error);
    throw error;
  }
};

// Export function
module.exports = { generateMonthlyInvoices };
