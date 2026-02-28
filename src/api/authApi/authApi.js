import apiServices from "../apiServices";

export const authApi = {
    // Login
    login: async (credentials) => {
        const response = await apiServices().post('auth/login', credentials);
        return response;
    },

    // Get all admins       
    getAllAdmins: async () => {
        const response = await apiServices().get('auth/admins');
        return response;
    },

    getAllSubAdmins: async () => {
        const response = await apiServices().get('auth/sub-admins');
        return response;
    },

    // Register
    register: async (userData) => {
        const response = await apiServices().post('auth/register', userData);
        return response;
    },

    // Forgot Password
    forgotPassword: async (email) => {
        const response = await apiServices().post('auth/forgot-password', { email });
        return response;
    },

    // Reset Password
    resetPassword: async (email, otp, password) => {
        const response = await apiServices().post('auth/reset-password', { email, otp, password });
        return response;
    },

    // Get current user
    getCurrentUser: async () => {
        const response = await apiServices().get('auth/me');
        return response;
    },

    // Update profile
    updateProfile: async (userData) => {
        const response = await apiServices().put('auth/profile', userData);
        return response;
    },

    // Change password
    changePassword: async (passwords) => {
        const response = await apiServices().put('auth/change-password', passwords);
        return response;
    },

    // Logout
    logout: async () => {
        const response = await apiServices().post('auth/logout');
        return response;
    },
    getAllUsers: async () => {
        const response = await apiServices().get('auth/users');
        return response;
    },
    accessHotelSuperAdminOnly: async (hotelId) => {    
        const response = await apiServices().post(`auth/access-hotel/${hotelId}`);
        return response;
    },
    // user update role based permisson apply 
    userProfileUpdate: async (userId,userData) => {
        const response = await apiServices().patch(`auth/users/${userId}`, userData);
        return response;
    },

    
};
