import apiServices from "../apiServices";
import { extractId } from "../../utils/apiUtils";

export const bookingApi = {
    createBooking: async (data) => {
        const response = await apiServices().post('bookings', data);
        return response;
    },
    getAllBookings: async () => {
        const response = await apiServices().get('bookings');
        return response;
    },
    getAllBookingsWithPagination: async (page, limit, status, roomId, room) => {
        const rId = extractId(roomId);
        let queryString = `bookings?page=${page}&limit=${limit}`;
        if (status) {
            queryString += `&status=${status}`;
        }
        if (rId) {
            queryString += `&roomId=${rId}`;
        }
        if (room) {
            queryString += `&room=${room}`;
        }
        const response = await apiServices().get(queryString);
        return response;
    },
    getBookingById: async (id) => {
        const bId = extractId(id);
        const response = await apiServices().get(`bookings/${bId}`);
        return response;
    },
    updateBooking: async (id, data) => {
        const bId = extractId(id);
        const response = await apiServices().patch(`bookings/${bId}`, data);
        return response;
    },
    deleteBooking: async (id) => {
        const bId = extractId(id);
        const response = await apiServices().delete(`bookings/${bId}`);
        return response;
    },
    updateBookingStatus: async (id, status, hotelId) => {
        const bId = extractId(id);
        const hId = extractId(hotelId);
        const response = await apiServices().patch(`bookings/${bId}/status?status=${status}&hotelId=${hId}`, { status, hotelId: hId });
        return response;
    },

    submitReviewWithToken: async (data) => {
        const response = await apiServices().post('reviews/submit-with-token', data);
        return response;
    },

    submitReviewWithHotelId: async (data) => {
        const response = await apiServices().post('reviews/public-submit', data);
        console.log(response);
        return response;
    },
    // get booking history for a specific room 
    getBookingHistory: async (roomId, startDate, endDate, hotelId) => {
        const rId = extractId(roomId);
        const hId = extractId(hotelId);
        const response = await apiServices().get(`bookings/room/${rId}/history?startDate=${startDate}&endDate=${endDate}&hotelId=${hId}`);
        return response;
    },
}