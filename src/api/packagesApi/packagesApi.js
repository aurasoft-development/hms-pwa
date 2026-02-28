import apiServices from "../apiServices";

export const packagesApi = {
    createPackage: async (hotelId, data) => {
        const response = await apiServices().post(`packages?hotelId=${hotelId}`, data);
        return response;
    },
    getAllPackages: async (hotelId) => {
        const response = await apiServices().get(`packages?hotelId=${hotelId}`);
        return response;
    },
    getAllPackagesWithOutHotelId: async (page, limit, isActive) => {
        let queryString = `packages?page=${page}&limit=${limit}`;
        if (isActive) {
            queryString += `&isActive=${isActive}`;
        }
        const response = await apiServices().get(queryString);
        return response;
    },
    getAllPackagesWithPagination: async (hotelId, page, limit, isActive) => {
        let queryString = `packages?hotelId=${hotelId}&page=${page}&limit=${limit}`;
        if (isActive) {
            queryString += `&isActive=${isActive}`;
        }
        const response = await apiServices().get(queryString);
        return response;
    },
    getPackageById: async (hotelId, packageId) => {
        const response = await apiServices().get(`packages/${packageId}?hotelId=${hotelId}`);
        return response;
    },
    updatePackage: async (hotelId, packageId, data) => {
        const response = await apiServices().patch(`packages/${packageId}?hotelId=${hotelId}`, data);
        return response;
    },
    deletePackage: async (hotelId, packageId) => {
        const response = await apiServices().delete(`packages/${packageId}?hotelId=${hotelId}`);
        return response;
    },
}