import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { formatSafeDate, safeDate } from './dateUtils';

export const pdfService = {
  generateReceipt: (booking, hotel = null) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = margin;

    // Hotel Information Header
    if (hotel) {
      doc.setFontSize(18);
      doc.setTextColor(128, 0, 32); // Burgundy color (#800020)
      doc.text(hotel.name || 'Grand Hotel', pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      if (hotel.address) {
        doc.text(hotel.address, pageWidth / 2, yPos, { align: 'center' });
        yPos += 6;
      }
      
      let contactInfo = '';
      if (hotel.phone) contactInfo += `Phone: ${hotel.phone}`;
      if (hotel.phone && hotel.email) contactInfo += ' | ';
      if (hotel.email) contactInfo += `Email: ${hotel.email}`;
      if (contactInfo) {
        doc.text(contactInfo, pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;
      }

      // Draw line after hotel info
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
    }

    // Receipt Header
    doc.setFontSize(16);
    doc.setTextColor(128, 0, 32); // Burgundy color (#800020)
    doc.text('HOTEL RECEIPT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Receipt #${booking.id}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(10);
    const createdAtText = formatSafeDate(booking.createdAt, (d) => format(d, 'PPp'), 'N/A');
    doc.text(`Date: ${createdAtText}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Guest Information
    doc.setFontSize(14);
    doc.text('Guest Information', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.text(`Name: ${booking.guestName}`, margin, yPos);
    yPos += 6;
    doc.text(`Email: ${booking.guestEmail || 'N/A'}`, margin, yPos);
    yPos += 6;
    doc.text(`Phone: ${booking.guestPhone || 'N/A'}`, margin, yPos);
    yPos += 15;

    // Booking Details
    doc.setFontSize(14);
    doc.text('Booking Details', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    if (booking.roomNumber) {
      doc.text(`Room: ${booking.roomNumber} (${booking.roomType || 'N/A'})`, margin, yPos);
    } else {
      doc.text(`Room Type: ${booking.roomType || 'N/A'}`, margin, yPos);
    }
    yPos += 6;
    const checkInText = formatSafeDate(booking.checkIn, (d) => format(d, 'PP'), 'N/A');
    doc.text(`Check-in: ${checkInText}`, margin, yPos);
    yPos += 6;
    const checkOutText = formatSafeDate(booking.checkOut, (d) => format(d, 'PP'), 'N/A');
    doc.text(`Check-out: ${checkOutText}`, margin, yPos);
    yPos += 6;
    doc.text(`Nights: ${booking.nights}`, margin, yPos);
    yPos += 15;

    // Charges Breakdown
    doc.setFontSize(14);
    doc.text('Charges Breakdown', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    const charges = [
      { item: `Room (${booking.nights || 0} nights)`, amount: booking.roomPrice || 0 },
    ];

    if (booking.packagePrice > 0) {
      charges.push({ item: `Package: ${booking.packageName}`, amount: booking.packagePrice });
    }

    if (booking.foodPackagePrice > 0) {
      charges.push({ item: `Food: ${booking.foodPackageName}`, amount: booking.foodPackagePrice });
    }

    charges.forEach((charge) => {
      doc.text(charge.item, margin, yPos);
      doc.text(`₹${charge.amount.toFixed(2)}`, pageWidth - margin - 30, yPos, { align: 'right' });
      yPos += 6;
    });

    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // Total
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Total Amount:', margin, yPos);
    doc.text(`₹${(booking.totalAmount || 0).toFixed(2)}`, pageWidth - margin - 30, yPos, { align: 'right' });
    yPos += 15;

    // Footer
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for your stay!', pageWidth / 2, pageWidth - 20, { align: 'center' });

    // Save PDF
    doc.save(`receipt_${booking.id}.pdf`);
  },
};

