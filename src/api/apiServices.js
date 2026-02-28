import axios from 'axios';

// Create an Axios instance with baseURL
const apiServices = () => {
  const baseURL = import.meta.env.VITE_API_URL || 'https://backend.hotelmanagement.aurasoftsolutions.com/';
  const instance = axios.create({
    baseURL: baseURL,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
  });

  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );


  instance.interceptors.response.use(
    response => response.data ? response.data : response,
    error => {
      let message;
      switch (error.response.status) {
        case 500:
          message = "Internal Server Error";
          break;
        case 401:
          message = "Unauthorized Access";
          break;
        case 404:
          message = "Data not found";
          break;
        default:
          message = error.response?.data?.message || error.message || "Something went wrong!";
      }
      return Promise.reject(message);
    }
  );

  return instance;
};

export default apiServices;
