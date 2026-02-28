import apiServices from "../apiServices";

export const hotelManagementApi = {
    createHotel: async (data) => {
        const response = await apiServices().post('hotels', data);
        return response;
    },
    getAllHotelsWithPagination: async (page, limit) => {
        const response = await apiServices().get(`hotels?page=${page}&limit=${limit}`);
        return response;
    },
    getAllHotels: async () => {
        const response = await apiServices().get('hotels');
        return response;
    },
    getHotelById: async (id) => {
        const response = await apiServices().get(`hotels/${id}`);
        return response;
    },
    updateHotel: async (id, data) => {
        const response = await apiServices().patch(`hotels/${id}`, data);
        return response;
    },
    deleteHotel: async (id) => {
        const response = await apiServices().delete(`hotels/${id}`);
        return response;
    },
    getMyHotel: async () => {
        const response = await apiServices().get('hotels/my-hotel');
        return response;
    },
}