import axios from "axios";
import { DollListView, PagedResponse } from "@/types/index";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = refreshResponse.headers.authorization;
        if (newToken) {
          localStorage.setItem("accessToken", newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch {
        localStorage.clear();
        if (typeof window !== "undefined") window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

// ✅ 인형 API
export const dollApi = {
  async getList(page = 0, size = 15): Promise<PagedResponse<DollListView>> {
    const res = await api.get("/dolls", { params: { page, size } });
    return res.data;
  },
  async getDetail(dollId: string): Promise<DollListView> {
    const res = await api.get(`/dolls/${dollId}`);
    return res.data;
  },
  async create(dollId: string): Promise<DollListView> {
    const res = await api.post("/dolls", { id: dollId });
    return res.data;
  },
  async delete(dollId: string): Promise<void> {
    await api.delete(`/dolls/${dollId}`);
  },
};

export const SSE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/notifications/stream`;
export default api;