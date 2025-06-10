import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosInstance } from 'axios';

/**
 * Creating an Axios instance with an interceptor
 * @param baseURL
 */
export function createService(baseURL: string): AxiosInstance {
  const service = axios.create({
    baseURL,
    timeout: 5000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: false, // 如需跨域携带 cookie 改成 true
  });

  // Request Interception
  service.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers!['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response Interception
  service.interceptors.response.use(
    (response: AxiosResponse) => {
      const res = response;
      return res;
    },
    (error) => {
      if (error.response) {
        const { status, data } = error.response;
        console.error(data?.status_message || `Status: ${status}，server anomaly!`);
      } else {
        console.error('The server is not responding!');
      }
      return Promise.reject(error);
    },
  );

  return service;
}
