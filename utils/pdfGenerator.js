const PDFDocument = require('pdfkit');

/**
 * Generate Professional Bill PDF
 * @param {Object} order - Order object from database
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateBillPDF = (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 40, right: 40 }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const pageWidth = 595.28;
      const margin = 40;
      const contentWidth = pageWidth - (margin * 2);

      // Header Background
      doc.rect(0, 0, pageWidth, 120).fill('#D35422');

      // Company Name
      doc.fillColor('#FFFFFF')
         .fontSize(24)
         .font('Helvetica-Bold')
         .text('The Chocolate Room', margin, 30, { align: 'center' });

      // Store Details
      doc.fontSize(10)
         .font('Helvetica')
         .text(order.storeDetails?.storeName || '', margin, 60, { align: 'center', width: contentWidth })
         .text(order.storeDetails?.address || '', margin, 75, { align: 'center', width: contentWidth })
         .text(`Tel: ${order.storeDetails?.contactNumber || 'N/A'}`, margin, 90, { align: 'center', width: contentWidth });

      // Tax Invoice Title
      doc.fillColor('#000000')
         .fontSize(18)
         .font('Helvetica-Bold')
         .text('TAX INVOICE', margin, 140, { align: 'center', width: contentWidth });

      let yPos = 180;

      // Bill Info Box
      doc.rect(margin, yPos, contentWidth, 60).stroke();
      
      // Left side info
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .text('Bill No:', margin + 10, yPos + 10)
         .font('Helvetica')
         .text(`BILL-${order.orderNumber}`, margin + 70, yPos + 10);
      
      doc.font('Helvetica-Bold')
         .text('Order No:', margin + 10, yPos + 25)
         .font('Helvetica')
         .text(order.orderNumber, margin + 70, yPos + 25);

      doc.font('Helvetica-Bold')
         .text('Order Type:', margin + 10, yPos + 40)
         .font('Helvetica')
         .text(order.orderType?.toUpperCase() || 'N/A', margin + 70, yPos + 40);

      // Right side info
      const rightX = margin + contentWidth - 150;
      doc.font('Helvetica-Bold')
         .text('Date:', rightX, yPos + 10)
         .font('Helvetica')
         .text(new Date(order.placedAt).toLocaleDateString('en-IN', {
           day: '2-digit', month: 'short', year: 'numeric'
         }), rightX + 40, yPos + 10);

      doc.font('Helvetica-Bold')
         .text('Time:', rightX, yPos + 25)
         .font('Helvetica')
         .text(new Date(order.placedAt).toLocaleTimeString('en-IN', {
           hour: '2-digit', minute: '2-digit'
         }), rightX + 40, yPos + 25);

      doc.font('Helvetica-Bold')
         .text('Payment:', rightX, yPos + 40)
         .font('Helvetica')
         .text(order.payment?.method?.toUpperCase() || 'N/A', rightX + 40, yPos + 40);

      yPos += 75;

      // Customer Details (if available)
      if (order.customerDetails && (order.customerDetails.fullName || order.customerDetails.mobileNumber)) {
        doc.rect(margin, yPos, contentWidth, 50).stroke();
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .text('Customer Details', margin + 10, yPos + 8);
        
        let custY = yPos + 23;
        if (order.customerDetails.fullName) {
          doc.fontSize(9).font('Helvetica').text(`Name: ${order.customerDetails.fullName}`, margin + 10, custY);
          custY += 12;
        }
        if (order.customerDetails.mobileNumber) {
          doc.text(`Mobile: ${order.customerDetails.mobileNumber}`, margin + 10, custY);
        }
        yPos += 65;
      }

      // Items Table Header
      doc.rect(margin, yPos, contentWidth, 25).fillAndStroke('#F3F4F6', '#000000');
      
      doc.fillColor('#000000')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Item Description', margin + 10, yPos + 8, { width: 250 })
         .text('Qty', margin + 270, yPos + 8, { width: 40, align: 'center' })
         .text('Rate', margin + 320, yPos + 8, { width: 70, align: 'right' })
         .text('Amount', margin + 400, yPos + 8, { width: 115, align: 'right' });

      yPos += 25;

      // Items
      doc.font('Helvetica').fontSize(9);
      order.items.forEach((item, index) => {
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }

        const rowHeight = 20;
        
        // Alternate row background
        if (index % 2 === 0) {
          doc.rect(margin, yPos, contentWidth, rowHeight).fill('#FAFAFA');
        }

        doc.fillColor('#000000')
           .text(item.itemName, margin + 10, yPos + 5, { width: 240 })
           .text(item.quantity.toString(), margin + 270, yPos + 5, { width: 40, align: 'center' })
           .text(`₹${item.basePrice.toFixed(2)}`, margin + 320, yPos + 5, { width: 70, align: 'right' })
           .text(`₹${item.itemTotal.toFixed(2)}`, margin + 400, yPos + 5, { width: 115, align: 'right' });

        yPos += rowHeight;
      });

      // Bottom border of table
      doc.moveTo(margin, yPos).lineTo(margin + contentWidth, yPos).stroke();
      yPos += 15;

      // Totals Section
      const totalsX = margin + contentWidth - 200;
      const labelX = totalsX;
      const valueX = totalsX + 110;

      doc.fontSize(9).font('Helvetica');
      
      // Subtotal
      doc.text('Subtotal:', labelX, yPos, { width: 100, align: 'left' })
         .text(`₹${order.pricing?.subtotal?.toFixed(2) || '0.00'}`, valueX, yPos, { width: 90, align: 'right' });
      yPos += 15;

      // Parcel Charges
      if (order.pricing?.parcelCharges && order.pricing.parcelCharges > 0) {
        doc.text('Parcel Charges:', labelX, yPos, { width: 100, align: 'left' })
           .text(`₹${order.pricing.parcelCharges.toFixed(2)}`, valueX, yPos, { width: 90, align: 'right' });
        yPos += 15;
      }

      // Tax
      doc.text('Tax (CGST + SGST):', labelX, yPos, { width: 100, align: 'left' })
         .text(`₹${order.pricing?.totalTax?.toFixed(2) || '0.00'}`, valueX, yPos, { width: 90, align: 'right' });
      yPos += 10;

      // Line before total
      doc.moveTo(labelX, yPos).lineTo(totalsX + 200, yPos).stroke();
      yPos += 10;

      // Grand Total
      doc.rect(labelX - 5, yPos - 3, 205, 22).fillAndStroke('#D35422', '#D35422');
      doc.fillColor('#FFFFFF')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('GRAND TOTAL:', labelX, yPos + 2, { width: 100, align: 'left' })
         .text(`₹${order.pricing?.grandTotal?.toFixed(2) || '0.00'}`, valueX, yPos + 2, { width: 90, align: 'right' });

      yPos += 35;

      // Payment Status
      doc.fillColor('#000000').fontSize(9).font('Helvetica');
      const paymentStatus = order.payment?.status?.toUpperCase() || 'PENDING';
      const statusColor = paymentStatus === 'PAID' ? '#10B981' : '#F59E0B';
      
      doc.text('Payment Status: ', margin, yPos)
         .fillColor(statusColor)
         .font('Helvetica-Bold')
         .text(paymentStatus, margin + 80, yPos);

      // Footer
      const footerY = 780;
      doc.moveTo(margin, footerY).lineTo(margin + contentWidth, footerY).stroke();
      doc.fillColor('#666666')
         .fontSize(8)
         .font('Helvetica-Oblique')
         .text('Thank you for your order! Visit us again!', margin, footerY + 10, { 
           align: 'center', 
           width: contentWidth 
         });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate Kitchen Order Ticket (KOT) PDF
 * @param {Object} order - Order object from database
 * @param {Array} kotItems - Filtered items for kitchen (non-packed items)
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateKOTPDF = (order, kotItems) => {
  return new Promise((resolve, reject) => {
    try {
      // 80mm thermal printer width = ~227 points
      const doc = new PDFDocument({ 
        size: [227, 600],
        margins: { top: 10, bottom: 10, left: 10, right: 10 }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const contentWidth = 207;
      let yPos = 10;

      // Header
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('KITCHEN ORDER TICKET', 10, yPos, { align: 'center', width: contentWidth });
      yPos += 18;

      doc.fontSize(11)
         .text('(KOT)', 10, yPos, { align: 'center', width: contentWidth });
      yPos += 15;

      // Divider
      doc.fontSize(8)
         .font('Helvetica')
         .text('================================', 10, yPos, { align: 'center', width: contentWidth });
      yPos += 12;

      // Order Info
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text(`KOT #${order.orderNumber}`, 10, yPos, { align: 'center', width: contentWidth });
      yPos += 16;

      doc.fontSize(9)
         .font('Helvetica')
         .text(`Order Type: ${order.orderType?.toUpperCase() || 'DINE-IN'}`, 10, yPos);
      yPos += 12;

      const orderTime = new Date(order.placedAt).toLocaleTimeString('en-IN', {
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
      doc.text(`Time: ${orderTime}`, 10, yPos);
      yPos += 12;

      if (order.table) {
        doc.font('Helvetica-Bold')
           .text(`TABLE: ${order.table}`, 10, yPos);
        yPos += 12;
      }

      // Divider
      doc.fontSize(8)
         .font('Helvetica')
         .text('================================', 10, yPos, { align: 'center', width: contentWidth });
      yPos += 12;

      // Items Header
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('ITEMS TO PREPARE:', 10, yPos);
      yPos += 15;

      // Items List
      kotItems.forEach((item, index) => {
        // Item number and name in bold
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text(`${index + 1}. ${item.itemName.toUpperCase()}`, 15, yPos, { width: contentWidth - 10 });
        yPos += 14;

        // Quantity - larger and clearer
        doc.fontSize(10)
           .font('Helvetica')
           .text('    Qty:', 15, yPos, { continued: true })
           .font('Helvetica-Bold')
           .fontSize(12)
           .text(` ${item.quantity}`, { continued: false });
        yPos += 15;

        // Special instructions if any
        if (item.specialInstructions) {
          doc.fontSize(9)
             .font('Helvetica-Oblique')
             .text(`    * ${item.specialInstructions}`, 15, yPos, { width: contentWidth - 20 });
          yPos += 14;
        }

        // Space between items
        yPos += 6;
      });

      // Overall Special Instructions
      if (order.specialInstructions) {
        yPos += 5;
        doc.fontSize(8)
           .font('Helvetica')
           .text('--------------------------------', 10, yPos, { align: 'center', width: contentWidth });
        yPos += 10;
        
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .text('SPECIAL NOTES:', 10, yPos);
        yPos += 12;
        
        doc.fontSize(9)
           .font('Helvetica')
           .text(order.specialInstructions, 10, yPos, { width: contentWidth });
        yPos += Math.ceil(order.specialInstructions.length / 30) * 11 + 8;
      }

      // Customer Info (if available)
      if (order.customerDetails && order.customerDetails.fullName) {
        yPos += 5;
        doc.fontSize(8)
           .font('Helvetica')
           .text('--------------------------------', 10, yPos, { align: 'center', width: contentWidth });
        yPos += 10;
        
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .text('Customer: ', 10, yPos, { continued: true })
           .font('Helvetica')
           .text(order.customerDetails.fullName);
        yPos += 11;
        
        if (order.customerDetails.mobileNumber) {
          doc.text(`Mobile: ${order.customerDetails.mobileNumber}`, 10, yPos);
          yPos += 11;
        }
      }

      // Footer
      yPos += 12;
      doc.fontSize(8)
         .font('Helvetica')
         .text('================================', 10, yPos, { align: 'center', width: contentWidth });
      yPos += 10;
      
      const printTime = new Date().toLocaleString('en-IN', {
        day: '2-digit', 
        month: 'short',
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
      doc.fontSize(7)
         .font('Helvetica')
         .text(`Printed: ${printTime}`, 10, yPos, { align: 'center', width: contentWidth });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateBillPDF,
  generateKOTPDF,
};
