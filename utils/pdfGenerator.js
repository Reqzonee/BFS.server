const PDFDocument = require('pdfkit');

/**
 * Generate Professional Bill PDF for 80mm Thermal Printer
 * Optimized for GA-E200 Thermal Printer (80mm width, 250mm/sec speed)
 * Interface: Serial, USB, Ethernet | Power: 1.5A | Cash Drawer: 1A
 * @param {Object} order - Order object from database
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateBillPDF = (order) => {
  return new Promise((resolve, reject) => {
    try {
      // 80mm = ~227 points (thermal printer width)
      const doc = new PDFDocument({
        size: [227, 841.89], // 80mm width, auto-height
        margins: { top: 8, bottom: 8, left: 8, right: 8 }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const pageWidth = 227;
      const margin = 8;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = 8;

      // Company Name
      doc.fillColor('#000000')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Bhakti Food Stall', margin, yPos, { align: 'center', width: contentWidth });
      yPos += 16;

      // Store Details
      doc.fontSize(7)
         .font('Helvetica');

      if (order.storeDetails?.storeName) {
        doc.text(order.storeDetails.storeName, margin, yPos, { align: 'center', width: contentWidth });
        yPos += 9;
      }

      if (order.storeDetails?.address) {
        doc.text(order.storeDetails.address, margin, yPos, { align: 'center', width: contentWidth });
        yPos += 9;
      }

      yPos += 3;

      // Divider
      doc.fontSize(6)
         .text('================================', margin, yPos, { align: 'center', width: contentWidth });
      yPos += 10;

      // Bill Title
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('TAX INVOICE', margin, yPos, { align: 'center', width: contentWidth });
      yPos += 14;

      // Bill Info with IST timezone
      doc.fontSize(7).font('Helvetica');

      const orderDate = new Date(order.placedAt);
      doc.text(`Date: ${orderDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' })}`, margin, yPos);
      yPos += 9;

      doc.text(`Time: ${orderDate.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false })}`, margin, yPos);
      yPos += 9;

      doc.text(`Type: ${order.orderType?.toUpperCase() || 'N/A'}`, margin, yPos);
      yPos += 12;

      // Customer Details (if available)
      if (order.customerDetails && (order.customerDetails.fullName || order.customerDetails.mobileNumber)) {
        doc.fontSize(7).font('Helvetica-Bold');
        doc.text('CUSTOMER:', margin, yPos);
        yPos += 9;

        doc.font('Helvetica');
        if (order.customerDetails.fullName) {
          doc.text(`Name: ${order.customerDetails.fullName}`, margin, yPos);
          yPos += 9;
        }
        if (order.customerDetails.mobileNumber) {
          doc.text(`Mobile: ${order.customerDetails.mobileNumber}`, margin, yPos);
          yPos += 9;
        }
        yPos += 3;
      }

      // Divider
      doc.fontSize(6)
         .text('================================', margin, yPos, { align: 'center', width: contentWidth });
      yPos += 8;

      // Items Header
      doc.fontSize(7).font('Helvetica-Bold');
      doc.text('Item', margin, yPos, { width: 110, continued: true })
         .text('Qty', { width: 30, align: 'center', continued: true })
         .text('Rate', { width: 35, align: 'right', continued: true })
         .text('Amt', { width: 35, align: 'right' });
      yPos += 9;

      doc.fontSize(6)
         .font('Helvetica')
         .text('--------------------------------', margin, yPos, { align: 'center', width: contentWidth });
      yPos += 8;

      // Items List
      doc.fontSize(7).font('Helvetica');
      order.items.forEach((item) => {
        // Item name (may wrap to multiple lines)
        doc.text(item.itemName, margin, yPos, { width: 110 });

        const itemY = yPos;
        doc.text(item.quantity.toString(), margin + 110, itemY, { width: 30, align: 'center' })
           .text(`₹${item.basePrice.toFixed(2)}`, margin + 140, itemY, { width: 35, align: 'right' })
           .text(`₹${item.itemTotal.toFixed(2)}`, margin + 175, itemY, { width: 35, align: 'right' });

        yPos += Math.ceil(item.itemName.length / 18) * 9 + 2;
      });

      yPos += 3;

      // Divider
      doc.fontSize(6)
         .text('================================', margin, yPos, { align: 'center', width: contentWidth });
      yPos += 8;

      // Totals Section
      doc.fontSize(7).font('Helvetica');

      const labelX = margin;
      const valueX = margin + contentWidth - 50;

      // Show total directly if no parcel charges or discount
      const hasBreakdown = (order.pricing?.parcelCharges && order.pricing.parcelCharges > 0) ||
                          (order.pricing?.discount && order.pricing.discount > 0);

      if (hasBreakdown) {
        // Subtotal
        doc.text('Subtotal:', labelX, yPos)
           .text(`₹${order.pricing?.subtotal?.toFixed(2) || '0.00'}`, valueX, yPos, { width: 50, align: 'right' });
        yPos += 9;

        // Parcel Charges
        if (order.pricing?.parcelCharges && order.pricing.parcelCharges > 0) {
          doc.text('Parcel Charges:', labelX, yPos)
             .text(`₹${order.pricing.parcelCharges.toFixed(2)}`, valueX, yPos, { width: 50, align: 'right' });
          yPos += 9;
        }

        // Discount
        if (order.pricing?.discount && order.pricing.discount > 0) {
          doc.text('Discount:', labelX, yPos)
             .text(`-₹${order.pricing.discount.toFixed(2)}`, valueX, yPos, { width: 50, align: 'right' });
          yPos += 9;

          if (order.coupon && order.coupon.code) {
            doc.fontSize(6).text(`(Code: ${order.coupon.code})`, labelX, yPos);
            yPos += 9;
            doc.fontSize(7);
          }
        }

        doc.fontSize(6)
           .text('--------------------------------', margin, yPos, { align: 'center', width: contentWidth });
        yPos += 8;
      }

      // Grand Total
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('TOTAL:', labelX, yPos)
         .text(`₹${order.pricing?.grandTotal?.toFixed(2) || '0.00'}`, valueX - 10, yPos, { width: 60, align: 'right' });
      yPos += 14;

      // Divider
      doc.fontSize(6)
         .text('================================', margin, yPos, { align: 'center', width: contentWidth });
      yPos += 10;

      // Footer
      doc.fontSize(7)
         .font('Helvetica-Oblique')
         .text('Thank you! Visit again!', margin, yPos, { align: 'center', width: contentWidth });
      yPos += 10;

      doc.fontSize(6)
         .font('Helvetica')
         .text('Bhakti Food Stall - Vasna', margin, yPos, { align: 'center', width: contentWidth });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate Kitchen Order Ticket (KOT) PDF for 80mm Thermal Printer
 * Uses daily KOT number (not order number)
 * Optimized for GA-E200 Thermal Printer
 * @param {Object} order - Order object from database
 * @param {Array} kotItems - Filtered items for kitchen (non-packed items)
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateKOTPDF = (order, kotItems) => {
  return new Promise((resolve, reject) => {
    try {
      // 80mm thermal printer width = ~227 points
      const doc = new PDFDocument({
        size: [227, 841.89],
        margins: { top: 8, bottom: 8, left: 8, right: 8 }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const contentWidth = 211;
      let yPos = 8;

      // Header
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('KITCHEN ORDER', 8, yPos, { align: 'center', width: contentWidth });
      yPos += 20;

      // Divider
      doc.fontSize(7)
         .font('Helvetica')
         .text('================================', 8, yPos, { align: 'center', width: contentWidth });
      yPos += 12;

      // KOT Number - Large and Prominent
      doc.rect(8, yPos, contentWidth, 30).stroke();
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text(`KOT #${order.kotNumber || '1'}`, 8, yPos + 8, { align: 'center', width: contentWidth });
      yPos += 35;

      // Order Type Badge
      const orderTypeText = (order.orderType?.toUpperCase() || 'DINE-IN');
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text(`● ${orderTypeText}`, 8, yPos);
      yPos += 14;

      // Time with IST timezone
      const orderTime = new Date(order.placedAt).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      doc.fontSize(9)
         .font('Helvetica')
         .text(`Time: ${orderTime}`, 8, yPos);
      yPos += 12;

      // Table (if available)
      if (order.table) {
        doc.font('Helvetica-Bold')
           .text(`TABLE: ${order.table}`, 8, yPos);
        yPos += 12;
      }

      // Divider
      doc.fontSize(7)
         .font('Helvetica')
         .text('================================', 8, yPos, { align: 'center', width: contentWidth });
      yPos += 10;

      // Items Header
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('ITEMS TO PREPARE:', 8, yPos);
      yPos += 14;

      // Items List
      kotItems.forEach((item, index) => {
        // Item number and name
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text(`${index + 1}. ${item.itemName.toUpperCase()}`, 12, yPos, { width: contentWidth - 8 });
        yPos += 16;

        // Quantity - large and bold
        doc.fontSize(11)
           .font('Helvetica')
           .text('    Qty:', 12, yPos, { continued: true })
           .font('Helvetica-Bold')
           .fontSize(14)
           .text(` ${item.quantity}`, { continued: false });
        yPos += 18;

        // Special instructions (if any)
        if (item.specialInstructions) {
          doc.fontSize(9)
             .font('Helvetica-Oblique')
             .text(`    * ${item.specialInstructions}`, 12, yPos, { width: contentWidth - 16 });
          yPos += 14;
        }

        yPos += 8;
      });

      // Overall Special Instructions
      if (order.specialInstructions) {
        yPos += 4;
        doc.fontSize(7)
           .font('Helvetica')
           .text('--------------------------------', 8, yPos, { align: 'center', width: contentWidth });
        yPos += 9;

        doc.fontSize(9)
           .font('Helvetica-Bold')
           .text('SPECIAL NOTES:', 8, yPos);
        yPos += 11;

        doc.fontSize(9)
           .font('Helvetica')
           .text(order.specialInstructions, 8, yPos, { width: contentWidth });
        yPos += Math.ceil(order.specialInstructions.length / 30) * 11 + 8;
      }

      // Customer Info (if available)
      if (order.customerDetails && order.customerDetails.fullName) {
        yPos += 4;
        doc.fontSize(7)
           .font('Helvetica')
           .text('--------------------------------', 8, yPos, { align: 'center', width: contentWidth });
        yPos += 9;

        doc.fontSize(9)
           .font('Helvetica-Bold')
           .text('Customer: ', 8, yPos, { continued: true })
           .font('Helvetica')
           .text(order.customerDetails.fullName);
        yPos += 11;

        if (order.customerDetails.mobileNumber) {
          doc.text(`Mobile: ${order.customerDetails.mobileNumber}`, 8, yPos);
          yPos += 11;
        }
      }

      // Footer
      yPos += 10;
      doc.fontSize(7)
         .font('Helvetica')
         .text('================================', 8, yPos, { align: 'center', width: contentWidth });
      yPos += 9;

      const printTime = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      doc.fontSize(6)
         .text(`Printed: ${printTime}`, 8, yPos, { align: 'center', width: contentWidth });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate Combined Bill + KOT PDF (2 pages in one PDF)
 * Page 1: Bill
 * Page 2: KOT
 * @param {Object} order - Order object from database
 * @param {Array} kotItems - Filtered items for kitchen (non-packed items)
 * @returns {Promise<Buffer>} Combined PDF buffer
 */
const generateCombinedPDF = (order, kotItems) => {
  return new Promise((resolve, reject) => {
    try {
      // 80mm = ~227 points (thermal printer width)
      const doc = new PDFDocument({
        size: [227, 841.89], // 80mm width, auto-height
        margins: { top: 8, bottom: 8, left: 8, right: 8 }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const pageWidth = 227;
      const margin = 8;
      const contentWidth = pageWidth - (margin * 2);

      // Helper function to format date in IST timezone
      const formatISTDate = (date) => {
        return new Date(date).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      };

      const formatISTTime = (date) => {
        return new Date(date).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      };

      // ==================== PAGE 1: BILL ====================
      let yPos = 8;

      // Company Name
      doc.fillColor('#000000')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Bhakti Food Stall', margin, yPos, { align: 'center', width: contentWidth });
      yPos += 16;

      // Store Details
      doc.fontSize(7)
         .font('Helvetica');

      if (order.storeDetails?.storeName) {
        doc.text(order.storeDetails.storeName, margin, yPos, { align: 'center', width: contentWidth });
        yPos += 9;
      }

      if (order.storeDetails?.address) {
        doc.text(order.storeDetails.address, margin, yPos, { align: 'center', width: contentWidth });
        yPos += 9;
      }

      yPos += 3;

      // Divider
      doc.fontSize(6)
         .text('================================', margin, yPos, { align: 'center', width: contentWidth });
      yPos += 10;

      // Bill Title
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('TAX INVOICE', margin, yPos, { align: 'center', width: contentWidth });
      yPos += 14;

      // Bill Info with IST timezone
      doc.fontSize(7).font('Helvetica');

      doc.text(`Date: ${formatISTDate(order.placedAt)}`, margin, yPos);
      yPos += 9;

      doc.text(`Time: ${formatISTTime(order.placedAt)}`, margin, yPos);
      yPos += 9;

      doc.text(`Type: ${order.orderType?.toUpperCase() || 'N/A'}`, margin, yPos);
      yPos += 12;

      // Customer Details (if available)
      if (order.customerDetails && (order.customerDetails.fullName || order.customerDetails.mobileNumber)) {
        doc.fontSize(7).font('Helvetica-Bold');
        doc.text('CUSTOMER:', margin, yPos);
        yPos += 9;

        doc.font('Helvetica');
        if (order.customerDetails.fullName) {
          doc.text(`Name: ${order.customerDetails.fullName}`, margin, yPos);
          yPos += 9;
        }
        if (order.customerDetails.mobileNumber) {
          doc.text(`Mobile: ${order.customerDetails.mobileNumber}`, margin, yPos);
          yPos += 9;
        }
        yPos += 3;
      }

      // Divider
      doc.fontSize(6)
         .text('================================', margin, yPos, { align: 'center', width: contentWidth });
      yPos += 8;

      // Items Header
      doc.fontSize(7).font('Helvetica-Bold');
      doc.text('Item', margin, yPos, { width: 110, continued: true })
         .text('Qty', { width: 30, align: 'center', continued: true })
         .text('Rate', { width: 35, align: 'right', continued: true })
         .text('Amt', { width: 35, align: 'right' });
      yPos += 9;

      doc.fontSize(6)
         .font('Helvetica')
         .text('--------------------------------', margin, yPos, { align: 'center', width: contentWidth });
      yPos += 8;

      // Items List
      doc.fontSize(7).font('Helvetica');
      order.items.forEach((item) => {
        doc.text(item.itemName, margin, yPos, { width: 110 });
        const itemY = yPos;
        doc.text(item.quantity.toString(), margin + 110, itemY, { width: 30, align: 'center' })
           .text(`₹${item.basePrice.toFixed(2)}`, margin + 140, itemY, { width: 35, align: 'right' })
           .text(`₹${item.itemTotal.toFixed(2)}`, margin + 175, itemY, { width: 35, align: 'right' });
        yPos += Math.ceil(item.itemName.length / 18) * 9 + 2;
      });

      yPos += 3;

      // Divider
      doc.fontSize(6)
         .text('================================', margin, yPos, { align: 'center', width: contentWidth });
      yPos += 8;

      // Totals Section
      doc.fontSize(7).font('Helvetica');
      const labelX = margin;
      const valueX = margin + contentWidth - 50;

      const hasBreakdown = (order.pricing?.parcelCharges && order.pricing.parcelCharges > 0) ||
                          (order.pricing?.discount && order.pricing.discount > 0);

      if (hasBreakdown) {
        doc.text('Subtotal:', labelX, yPos)
           .text(`₹${order.pricing?.subtotal?.toFixed(2) || '0.00'}`, valueX, yPos, { width: 50, align: 'right' });
        yPos += 9;

        if (order.pricing?.parcelCharges && order.pricing.parcelCharges > 0) {
          doc.text('Parcel Charges:', labelX, yPos)
             .text(`₹${order.pricing.parcelCharges.toFixed(2)}`, valueX, yPos, { width: 50, align: 'right' });
          yPos += 9;
        }

        if (order.pricing?.discount && order.pricing.discount > 0) {
          doc.text('Discount:', labelX, yPos)
             .text(`-₹${order.pricing.discount.toFixed(2)}`, valueX, yPos, { width: 50, align: 'right' });
          yPos += 9;

          if (order.coupon && order.coupon.code) {
            doc.fontSize(6).text(`(Code: ${order.coupon.code})`, labelX, yPos);
            yPos += 9;
            doc.fontSize(7);
          }
        }

        doc.fontSize(6)
           .text('--------------------------------', margin, yPos, { align: 'center', width: contentWidth });
        yPos += 8;
      }

      // Grand Total
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('TOTAL:', labelX, yPos)
         .text(`₹${order.pricing?.grandTotal?.toFixed(2) || '0.00'}`, valueX - 10, yPos, { width: 60, align: 'right' });
      yPos += 14;

      // Divider
      doc.fontSize(6)
         .font('Helvetica')
         .text('================================', margin, yPos, { align: 'center', width: contentWidth });
      yPos += 10;

      // Footer
      doc.fontSize(7)
         .font('Helvetica-Oblique')
         .text('Thank you! Visit again!', margin, yPos, { align: 'center', width: contentWidth });
      yPos += 10;

      doc.fontSize(6)
         .font('Helvetica')
         .text('Bhakti Food Stall - Vasna', margin, yPos, { align: 'center', width: contentWidth });

      // ==================== PAGE 2: KOT ====================
      doc.addPage();
      yPos = 8;

      // Header
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('KITCHEN ORDER', 8, yPos, { align: 'center', width: contentWidth });
      yPos += 20;

      // Divider
      doc.fontSize(7)
         .font('Helvetica')
         .text('================================', 8, yPos, { align: 'center', width: contentWidth });
      yPos += 12;

      // KOT Number
      doc.rect(8, yPos, contentWidth, 30).stroke();
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text(`KOT #${order.kotNumber || '1'}`, 8, yPos + 8, { align: 'center', width: contentWidth });
      yPos += 35;

      // Order Type
      const orderTypeText = (order.orderType?.toUpperCase() || 'DINE-IN');
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text(`● ${orderTypeText}`, 8, yPos);
      yPos += 14;

      // Time with IST
      doc.fontSize(9)
         .font('Helvetica')
         .text(`Time: ${formatISTTime(order.placedAt)}`, 8, yPos);
      yPos += 12;

      // Table (if available)
      if (order.table) {
        doc.font('Helvetica-Bold')
           .text(`TABLE: ${order.table}`, 8, yPos);
        yPos += 12;
      }

      // Divider
      doc.fontSize(7)
         .font('Helvetica')
         .text('================================', 8, yPos, { align: 'center', width: contentWidth });
      yPos += 10;

      // Items Header
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('ITEMS TO PREPARE:', 8, yPos);
      yPos += 14;

      // KOT Items List
      kotItems.forEach((item, index) => {
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text(`${index + 1}. ${item.itemName.toUpperCase()}`, 12, yPos, { width: contentWidth - 8 });
        yPos += 16;

        doc.fontSize(11)
           .font('Helvetica')
           .text('    Qty:', 12, yPos, { continued: true })
           .font('Helvetica-Bold')
           .fontSize(14)
           .text(` ${item.quantity}`, { continued: false });
        yPos += 18;

        if (item.specialInstructions) {
          doc.fontSize(9)
             .font('Helvetica-Oblique')
             .text(`    * ${item.specialInstructions}`, 12, yPos, { width: contentWidth - 16 });
          yPos += 14;
        }

        yPos += 8;
      });

      // Overall Special Instructions
      if (order.specialInstructions) {
        yPos += 4;
        doc.fontSize(7)
           .font('Helvetica')
           .text('--------------------------------', 8, yPos, { align: 'center', width: contentWidth });
        yPos += 9;

        doc.fontSize(9)
           .font('Helvetica-Bold')
           .text('SPECIAL NOTES:', 8, yPos);
        yPos += 11;

        doc.fontSize(9)
           .font('Helvetica')
           .text(order.specialInstructions, 8, yPos, { width: contentWidth });
        yPos += Math.ceil(order.specialInstructions.length / 30) * 11 + 8;
      }

      // Customer Info
      if (order.customerDetails && order.customerDetails.fullName) {
        yPos += 4;
        doc.fontSize(7)
           .font('Helvetica')
           .text('--------------------------------', 8, yPos, { align: 'center', width: contentWidth });
        yPos += 9;

        doc.fontSize(9)
           .font('Helvetica-Bold')
           .text('Customer: ', 8, yPos, { continued: true })
           .font('Helvetica')
           .text(order.customerDetails.fullName);
        yPos += 11;

        if (order.customerDetails.mobileNumber) {
          doc.text(`Mobile: ${order.customerDetails.mobileNumber}`, 8, yPos);
          yPos += 11;
        }
      }

      // Footer
      yPos += 10;
      doc.fontSize(7)
         .font('Helvetica')
         .text('================================', 8, yPos, { align: 'center', width: contentWidth });
      yPos += 9;

      const printTime = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      doc.fontSize(6)
         .text(`Printed: ${printTime}`, 8, yPos, { align: 'center', width: contentWidth });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateBillPDF,
  generateKOTPDF,
  generateCombinedPDF,
};
