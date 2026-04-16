import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

api.interceptors.request.use(
  (config) => {
    // --- DEMO MODE INTERCEPT ---
    if (localStorage.getItem("demo_mode") === "true" && window.__demoMockApi) {
      config.__demo = true;
      const controller = new AbortController();
      config.signal = controller.signal;
      controller.abort("__demo__");
      return config;
    }

    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // --- DEMO MODE: intercept aborted requests and return mock data ---
    if (
      error?.message === "__demo__" ||
      (error?.code === "ERR_CANCELED" && error?.message === "__demo__") ||
      (error?.name === "CanceledError" &&
        localStorage.getItem("demo_mode") === "true")
    ) {
      if (window.__demoMockApi && error.config) {
        const { method, url, data } = error.config;
        let parsedData;
        try {
          parsedData = typeof data === "string" ? JSON.parse(data) : data;
        } catch {
          parsedData = data;
        }

        const relativeUrl = url.replace(/^https?:\/\/[^/]+/, "");

        try {
          const mockData = await window.__demoMockApi(
            (method || "GET").toUpperCase(),
            relativeUrl,
            parsedData,
          );

          // FIX: If the mock API already provides an object with a 'data' property,
          // assume it's correctly shaped and return it directly without double-wrapping.
          if (mockData && typeof mockData === "object" && "data" in mockData) {
            return mockData;
          }

          // Otherwise, wrap raw JSON payloads in an Axios response shell
          return {
            data: mockData,
            status: 200,
            statusText: "OK",
            headers: {},
            config: error.config,
          };
        } catch (mockError) {
          return Promise.reject(mockError);
        }
      }
    }

    // --- REAL TOKEN REFRESH LOGIC ---
    const originalRequest = error.config;
    const isAuthRequest =
      originalRequest?.url?.includes("token") ||
      originalRequest?.url?.includes("register");

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        if (!refreshToken) throw new Error("No refresh token");

        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}authentication/token/refresh/`,
          { refresh: refreshToken },
        );

        if (res.status === 200) {
          const newAccessToken = res.data.access;
          localStorage.setItem(ACCESS_TOKEN, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.clear();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;