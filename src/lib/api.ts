import axios from "axios";
import { DollListView, PagedResponse } from "@/types/index";

// ✅ axios 인스턴스 생성
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ 요청 인터셉터: Access Token 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ 응답 인터셉터: 401 토큰 만료 시 Refresh
api.interceptors.response.use(
  (response) => response,
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

        const newAccessToken = refreshResponse.headers.authorization;
        if (newAccessToken) {
          localStorage.setItem("accessToken", newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        localStorage.clear();
        if (typeof window !== "undefined") window.location.href = "/";
        return Promise.reject(refreshError);
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

export default api;