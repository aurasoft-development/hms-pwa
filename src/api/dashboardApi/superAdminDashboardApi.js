import apiServices from "../apiServices";

export const superAdminDashboardApi = {
    getSuperAdminDashboardStats: async () => {
        const response = await apiServices().get('/dashboard/stats');
        return response;
    }
}