import apiServices from "../apiServices";
import { extractId } from "../../utils/apiUtils";

export const roomManagementApi = {
    createRoom: async (hotelId, data) => {
        const hId = extractId(hotelId);
        const response = await apiServices().post(`rooms?hotelId=${hId}`, data);
        return response;
    },
    getAllRooms: async (hotelId) => {
        const hId = extractId(hotelId);
        const response = await apiServices().get(`rooms?hotelId=${hId}`);
        return response;
    },
    getAllRoomsWithPagination: async (hotelId, page, limit, roomType, status) => {
        const hId = extractId(hotelId);
        let queryString = `rooms?hotelId=${hId}&page=${page}&limit=${limit}`;
        if (roomType) {
            queryString += `&roomType=${roomType}`;
        }
        if (status) {
            queryString += `&status=${status}`;
        }
        const response = await apiServices().get(queryString);
        return response;
    },
    getRoomById: async (hotelId, roomId) => {
        const hId = extractId(hotelId);
        const rId = extractId(roomId);
        const response = await apiServices().get(`rooms/${rId}?hotelId=${hId}`);
        return response;
    },
    updateRoom: async (hotelId, roomId, data) => {
        const hId = extractId(hotelId);
        const rId = extractId(roomId);
        const response = await apiServices().patch(`rooms/${rId}?hotelId=${hId}`, data);
        return response;
    },
    deleteRoom: async (hotelId, roomId) => {
        const hId = extractId(hotelId);
        const rId = extractId(roomId);
        const response = await apiServices().delete(`rooms/${rId}?hotelId=${hId}`);
        return response;
    },
    updateRoomStatus: async (roomId, status) => {
        const rId = extractId(roomId);
        const response = await apiServices().patch(`rooms/${rId}/status?status=${status}`);
        return response;
    },
    getAvailableRoomsForDateRange: async (hotelId, checkInDate, checkOutDate, roomType) => {
        const hId = extractId(hotelId);
        let queryString = `rooms/available?hotelId=${hId}&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`;
        if (roomType) {
            queryString += `&roomType=${roomType}`;
        }
        const response = await apiServices().get(queryString);
        return response;
    },
}

