/**
 * Invoice Service - Generates and downloads invoices as HTML files
 */

export function downloadInvoice(invoiceData) {
  const {
    invoiceNumber,
    guestName,
    guestEmail,
    guestPhone,
    roomNumber,
    roomType,
    checkIn,
    checkOut,
    checkedOutAt,
    hotel,
    roomCharges,
    extraCharges,
    subtotal,
    gst,
    total,
    folioItems = [],
    payments = [],
  } = invoiceData;

  const invoiceHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            background: #f5f5f5;
            color: #333;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 8px;
        }
        .header {
            border-bottom: 3px solid #800020;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .hotel-info h1 {
            color: #800020;
            font-size: 28px;
            margin-bottom: 10px;
        }
        .hotel-info p {
            color: #666;
            font-size: 14px;
            line-height: 1.6;
        }
        .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
        }
        .invoice-number {
            text-align: right;
        }
        .invoice-number h2 {
            color: #800020;
            font-size: 24px;
            margin-bottom: 5px;
        }
        .invoice-number p {
            color: #666;
            font-size: 14px;
        }
        .guest-info {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 30px;
        }
        .guest-info h3 {
            color: #800020;
            margin-bottom: 15px;
            font-size: 18px;
        }
        .guest-details {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        .guest-details p {
            color: #333;
            font-size: 14px;
        }
        .guest-details strong {
            color: #800020;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table thead {
            background: #800020;
            color: white;
        }
        .items-table th {
            padding: 12px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
        }
        .items-table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
            font-size: 14px;
        }
        .items-table tbody tr:hover {
            background: #f9f9f9;
        }
        .totals {
            margin-top: 20px;
            margin-left: auto;
            width: 300px;
        }
        .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
        }
        .totals-row.total {
            border-top: 2px solid #800020;
            margin-top: 10px;
            padding-top: 15px;
            font-size: 18px;
            font-weight: bold;
            color: #800020;
        }
        .payments {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #eee;
        }
        .payments h3 {
            color: #800020;
            margin-bottom: 15px;
            font-size: 18px;
        }
        .payment-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
            border-bottom: 1px solid #eee;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .invoice-container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="hotel-info">
                <h1>${hotel?.name || 'Grand Hotel'}</h1>
                <p>${hotel?.address || '123 Main Street, City'}</p>
                <p>Phone: ${hotel?.phone || '+1234567890'} | Email: ${hotel?.email || 'info@hotel.com'}</p>
            </div>
        </div>

        <div class="invoice-header">
            <div>
                <h3 style="color: #800020; margin-bottom: 10px;">Guest Information</h3>
            </div>
            <div class="invoice-number">
                <h2>INVOICE</h2>
                <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
                <p><strong>Date:</strong> ${new Date(checkedOutAt || Date.now()).toLocaleDateString()}</p>
            </div>
        </div>

        <div class="guest-info">
            <div class="guest-details">
                <p><strong>Guest Name:</strong> ${guestName}</p>
                <p><strong>Room:</strong> ${roomNumber} - ${roomType}</p>
                <p><strong>Email:</strong> ${guestEmail || 'N/A'}</p>
                <p><strong>Phone:</strong> ${guestPhone || 'N/A'}</p>
                <p><strong>Check-in:</strong> ${new Date(checkIn).toLocaleDateString()}</p>
                <p><strong>Check-out:</strong> ${new Date(checkOut).toLocaleDateString()}</p>
            </div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Room Charges (${roomType})</td>
                    <td style="text-align: right;">$${roomCharges.toFixed(2)}</td>
                </tr>
                ${folioItems
                  .map(
                    (item) => `
                <tr>
                    <td>${item.description}</td>
                    <td style="text-align: right;">$${parseFloat(item.amount).toFixed(2)}</td>
                </tr>
                `
                  )
                  .join('')}
            </tbody>
        </table>

        <div class="totals">
            <div class="totals-row">
                <span>Subtotal:</span>
                <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="totals-row">
                <span>GST (18%):</span>
                <span>$${gst.toFixed(2)}</span>
            </div>
            <div class="totals-row total">
                <span>Total Amount:</span>
                <span>$${total.toFixed(2)}</span>
            </div>
        </div>

        ${payments.length > 0 ? `
        <div class="payments">
            <h3>Payments</h3>
            ${payments
              .map(
                (payment) => `
            <div class="payment-item">
                <span>${payment.method.charAt(0).toUpperCase() + payment.method.slice(1)} - ${new Date(payment.createdAt).toLocaleString()}</span>
                <span>$${parseFloat(payment.amount).toFixed(2)}</span>
            </div>
            `
              )
              .join('')}
            <div class="totals-row total" style="margin-top: 15px;">
                <span>Total Paid:</span>
                <span>$${payments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2)}</span>
            </div>
        </div>
        ` : ''}

        <div class="footer">
            <p>Thank you for staying with us!</p>
            <p>This is a computer-generated invoice.</p>
        </div>
    </div>
</body>
</html>
  `;

  // Create blob and download
  const blob = new Blob([invoiceHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Invoice_${invoiceNumber}_${guestName.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

