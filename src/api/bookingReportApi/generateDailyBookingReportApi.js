import apiServices from "../apiServices";

export const generateDailyBookingReportApi = {
    // date format YYYY-MM-DD // PDF format 
    generateDailyBookingReportPDFFormat: async (hotelId, date) => {
        const response = await apiServices().get(`/bookings/reports/daily/pdf?date=${date}&hotelId=${hotelId}`, {
            responseType: 'blob'
        });
        return response;
    },
    // date format YYYY-MM-DD // XLSX format
    generateDailyBookingReportXLSXFormat: async (hotelId, date) => {
        const response = await apiServices().get(`/bookings/reports/daily/xlsx?date=${date}&hotelId=${hotelId}`, {
            responseType: 'blob'
        });
        return response;
    }
}   