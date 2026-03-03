// Mock WhatsApp notification service (simulating Twilio)

export const whatsappService = {
  sendNotification: async (phoneNumber, message) => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In a real app, this would call Twilio API
    console.log(`[MOCK WhatsApp] Sending to ${phoneNumber}: ${message}`);

    return {
      success: true,
      messageId: `msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
  },

  async sendBookingConfirmation(phoneNumber, bookingDetails) {
    // Format phone number with country code before sending
    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    const message = `🏨 Booking Confirmation\n\n` +
      `Guest: ${bookingDetails.guestName}\n` +
      `Room: ${bookingDetails.roomType}\n` +
      `Check-in: ${bookingDetails.checkIn}\n` +
      `Check-out: ${bookingDetails.checkOut}\n` +
      `Total: ₹${bookingDetails.totalAmount}\n\n` +
      `Thank you for choosing us!`;

    return await this.sendNotification(formattedPhone || phoneNumber, message);
  },

  /**
   * Share booking details with the manager via WhatsApp
   * @param {Object} booking - Booking details object
   * @param {string} managerPhoneNumber - Manager's phone number
   */
  shareBookingDetailsWithManager(booking, managerPhoneNumber) {
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      } catch {
        return dateString;
      }
    };

    const formatTime = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return '';
      }
    }


    let message = `🆕 *NEW BOOKING ALERT*\n\n`;
    message += `Guest: *${booking.guestName}*\n`;
    message += `Phone: ${booking.guestPhone}\n`;
    message += `Room: ${booking.roomNumber ? `*${booking.roomNumber}*` : ''} (${booking.roomType})\n`;

    message += `\n📅 *Stay Details*\n`;
    message += `Check-in: ${formatDate(booking.checkIn)} ${formatTime(booking.checkIn)}\n`;
    message += `Check-out: ${formatDate(booking.checkOut)} ${formatTime(booking.checkOut)}\n`;
    message += `Nights: ${booking.nights}\n`;

    message += `\n💰 *Payment Details*\n`;
    message += `Total Amount: *₹${(booking.totalAmount || 0).toLocaleString()}*\n`;
    message += `Payment Status: ${booking.paymentStatus || 'Pending'}\n`;

    if (booking.notes) {
      message += `\n📝 *Notes*\n${booking.notes}\n`;
    }

    // Use specific manager number or default
    this.shareOnWhatsApp(managerPhoneNumber, message);
  },

  /**
   * Generate formatted receipt message for WhatsApp sharing
   */
  generateReceiptMessage(booking) {
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch {
        return dateString;
      }
    };

    let message = `🏨 *HOTEL RECEIPT*\n`;
    message += `━━━━━━━━━━━━━━━━━\n`;
    message += `*Receipt ID:* #${booking._id || booking.id || 'N/A'}\n`;
    message += `*Date:* ${formatDate(booking.createdAt || new Date())}\n\n`;

    message += `👤 *GUEST DETAILS*\n`;
    message += `*Name:* ${booking.guestName}\n`;
    if (booking.guestPhone) message += `*Phone:* ${booking.guestPhone}\n`;
    message += `\n`;

    message += `🛏️ *STAY DETAILS*\n`;
    const roomNum = booking.roomNumber || (booking.room && (booking.room.roomNumber || booking.room.number));
    const roomT = booking.roomType || (booking.room && (booking.room.roomType || booking.room.type));

    message += `*Room:* ${roomNum || 'N/A'} (${roomT || 'N/A'})\n`;
    message += `*Check-in:* ${formatDate(booking.checkInDate || booking.checkIn)}\n`;
    message += `*Check-out:* ${formatDate(booking.checkOutDate || booking.checkOut)}\n`;
    message += `*Nights:* ${booking.nights || 0}\n`;
    message += `\n`;

    message += `💰 *BILLING SUMMARY*\n`;
    message += `*Room Charges:* ₹${(booking.roomPrice || 0).toLocaleString()}\n`;

    if (booking.packagePrice > 0) {
      message += `*Package (${booking.packageName || 'N/A'}):* ₹${(booking.packagePrice || 0).toLocaleString()}\n`;
    }

    if (booking.foodPackagePrice > 0 || (booking.foodPackage && booking.foodPackage.price)) {
      const fpt = booking.foodPackageName || (booking.foodPackage && booking.foodPackage.name) || 'Food';
      const fpp = booking.foodPackagePrice || (booking.foodPackage && booking.foodPackage.price) || 0;
      message += `*Food (${fpt}):* ₹${fpp.toLocaleString()}\n`;
    }

    message += `━━━━━━━━━━━━━━━━━\n`;
    message += `*TOTAL AMOUNT: ₹${(booking.totalAmount || booking.total || 0).toLocaleString()}*\n`;
    message += `━━━━━━━━━━━━━━━━━\n\n`;
    message += `Thank you for choosing us! 🙏`;

    return message;
  },

  /**
   * Generate a concise booking summary for quick sharing
   */
  generateBookingSummary(booking) {
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      } catch {
        return dateString;
      }
    };

    let message = `✅ *BOOKING CONFIRMED*\n\n`;
    message += `*ID:* #${booking._id?.slice(-6) || booking.id || 'N/A'}\n`;
    message += `*Guest:* ${booking.guestName}\n`;
    message += `*Room:* ${booking.roomNumber || 'N/A'}\n`;
    message += `*Dates:* ${formatDate(booking.checkInDate || booking.checkIn)} - ${formatDate(booking.checkOutDate || booking.checkOut)}\n`;
    message += `*Total:* ₹${(booking.totalAmount || 0).toLocaleString()}\n\n`;
    message += `Shared via Hotel Management System`;

    return message;
  },

  /**
   * Format phone number with country code for WhatsApp
   * @param {string} phoneNumber - Phone number (with or without country code)
   * @param {string} defaultCountryCode - Default country code (default: '91' for India)
   * @returns {string} - Formatted phone number with country code
   */
  formatPhoneNumber(phoneNumber, defaultCountryCode = '91') {
    if (!phoneNumber) return null;

    // Remove any non-digit characters
    let cleanPhone = phoneNumber.replace(/\D/g, '');

    // Remove leading + if present (already removed by \D)
    // Remove leading 0 if present (common in Indian numbers)
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }

    // Check if country code already exists
    // Indian numbers: +91XXXXXXXXXX (12 digits) or XXXXXXXXXX (10 digits)
    if (cleanPhone.length === 10) {
      // 10 digits - add country code
      cleanPhone = defaultCountryCode + cleanPhone;
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      // 11 digits starting with 0 - remove 0 and add country code
      cleanPhone = defaultCountryCode + cleanPhone.substring(1);
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      // Already has country code
      // Keep as is
    } else if (cleanPhone.length > 12) {
      // Has country code with + or other format
      // Extract last 12 digits (91 + 10 digits)
      cleanPhone = cleanPhone.slice(-12);
    } else if (cleanPhone.length < 10) {
      // Invalid number
      console.warn('Invalid phone number format:', phoneNumber);
      return null;
    }

    return cleanPhone;
  },

  /**
   * Open WhatsApp with pre-filled message
   * @param {string} phoneNumber - Phone number with or without country code
   * @param {string} message - Message to send
   */
  shareOnWhatsApp(phoneNumber, message) {
    // Format phone number with country code
    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    if (!formattedPhone) {
      console.error('Invalid phone number:', phoneNumber);
      // Open WhatsApp without number (user can select contact)
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      return;
    }

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    // Create WhatsApp Web link
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

    // Open in new window/tab
    window.open(whatsappUrl, '_blank');
  },

  /**
   * Share receipt to WhatsApp
   * @param {Object} booking - Booking object
   * @param {string} phoneNumber - Optional phone number (if not provided, opens without number)
   */
  shareReceipt(booking, phoneNumber = null) {
    const message = this.generateReceiptMessage(booking);

    if (phoneNumber) {
      this.shareOnWhatsApp(phoneNumber, message);
    } else {
      // If no phone number, open WhatsApp with message (user can select contact)
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    }
  },

  /**
   * Share event booking details with the manager via WhatsApp
   * @param {Object} eventData - The event data containing event and bookings array
   * @param {string} managerPhoneNumber - Manager's phone number
   */
  shareEventDetailsWithManager(eventData, managerPhoneNumber) {
    const event = eventData.event || eventData;
    const bookings = eventData.bookings || [];

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      } catch {
        return dateString;
      }
    };

    let message = `🎊 *NEW EVENT BOOKING ALERT*\n\n`;
    message += `Event: *${event.name}*\n`;
    message += `Type: ${event.type}\n`;
    message += `Organizer: *${event.organizerName}*\n`;
    message += `Phone: ${event.organizerPhone}\n\n`;

    message += `📅 *Schedule*\n`;
    message += `From: ${formatDate(event.startDate)}\n`;
    message += `To: ${formatDate(event.endDate)}\n\n`;

    message += `🛏️ *Accommodations*\n`;
    message += `Total Rooms: *${bookings.length || event.roomIds?.length || 0}*\n`;

    if (bookings.length > 0) {
      const roomNumbers = bookings.map(b => b.roomNumber || b.room?.roomNumber).filter(Boolean);
      if (roomNumbers.length > 0) {
        message += `Rooms: ${roomNumbers.join(', ')}\n`;
      }
    }

    message += `\n💰 *Financials*\n`;
    message += `Advance Paid: *₹${(event.advancePaid || 0).toLocaleString()}*\n`;

    if (event.notes) {
      message += `\n📝 *Notes*\n${event.notes}\n`;
    }

    message += `\nShared via Hotel Management System`;

    this.shareOnWhatsApp(managerPhoneNumber, message);
  },

  /**
   * Generate formatted receipt message for an event
   */
  generateEventReceiptMessage(eventData) {
    const event = eventData.event || eventData;
    const bookings = eventData.bookings || [];

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch {
        return dateString;
      }
    };

    let message = `🎊 *EVENT BOOKING RECEIPT*\n`;
    message += `━━━━━━━━━━━━━━━━━\n`;
    message += `*Event:* ${event.name}\n`;
    message += `*Organizer:* ${event.organizerName}\n`;
    message += `*Date:* ${formatDate(event.createdAt || new Date())}\n\n`;

    message += `📅 *EVENT SCHEDULE*\n`;
    message += `*From:* ${formatDate(event.startDate)}\n`;
    message += `*To:* ${formatDate(event.endDate)}\n\n`;

    message += `🛏️ *ACCOMMODATIONS*\n`;
    message += `*Total Rooms:* ${bookings.length || event.roomIds?.length || 0}\n`;
    if (bookings.length > 0) {
      const roomNumbers = bookings.map(b => b.roomNumber || b.room?.roomNumber).filter(Boolean);
      if (roomNumbers.length > 0) {
        message += `*Rooms:* ${roomNumbers.join(', ')}\n`;
      }
    }
    message += `\n`;

    message += `💰 *FINANCIAL SUMMARY*\n`;
    message += `*Advance Paid:* ₹${(event.advancePaid || 0).toLocaleString()}\n`;
    message += `━━━━━━━━━━━━━━━━━\n\n`;
    message += `Thank you for choosing us for your special occasion! 🙏`;

    return message;
  },

  /**
   * Share event receipt to WhatsApp
   * @param {Object} eventData - Event data object
   * @param {string} phoneNumber - Optional phone number
   */
  shareEventReceipt(eventData, phoneNumber = null) {
    const message = this.generateEventReceiptMessage(eventData);

    if (phoneNumber) {
      this.shareOnWhatsApp(phoneNumber, message);
    } else {
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    }
  },
};

