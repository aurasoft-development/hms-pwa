import apiServices from "../apiServices";

export const eventBookingApi = {
    /**
     * Create a bulk event booking
     * @param {string} hotelId - The ID of the hotel
     * @param {Object} data - The booking data (eventName, description, eventType, organizerName, organizerEmail, organizerPhone, startDate, endDate, roomIds, advancePaid, notes)
     */
    createBulkEventBooking: async (hotelId, data) => {
        const response = await apiServices().post(`/bookings/events?hotelId=${hotelId}`, data);
        return response;
    },
    // get all events with pagination 
    getAllEventsWithPagination: async (hotelId, page, limit) => {
        const response = await apiServices().get(`/bookings/events?hotelId=${hotelId}&page=${page}&limit=${limit}`);
        return response;
    },
    // get an event with all linked bookings 
    getEventWithAllLinkedBooking: async (hotelId, eventId) => {
        const response = await apiServices().get(`/bookings/events/${eventId}?hotelId=${hotelId}`);
        return response;
    },

};