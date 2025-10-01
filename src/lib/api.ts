// src/lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8080/api",
  withCredentials: true, // 쿠키(Refresh Token)를 주고받기 위해 필수
});

// 요청 인터셉터: 모든 API 요청 헤더에 Access Token을 자동으로 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터: 토큰 만료(401) 시 자동으로 토큰 재발급 후 이전 요청 재시도
api.interceptors.response.use(
  (response) => response, // 성공적인 응답은 그대로 반환
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고, 재시도 플래그가 없는 경우에만 실행
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // 재시도 무한 루프 방지

      try {
        // Refresh Token으로 새로운 Access Token 요청 (쿠키는 자동으로 전송됨)
        const refreshResponse = await axios.post("http://127.0.0.1:8080/api/refresh", {}, {
          withCredentials: true,
        });

        const newAccessToken = refreshResponse.headers.authorization;
        if (newAccessToken) {
          localStorage.setItem("accessToken", newAccessToken);
          
          // 실패했던 원래 요청의 헤더를 새 토큰으로 교체
          originalRequest.headers.Authorization = newAccessToken;

          // 원래 요청을 다시 실행
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh마저 실패하면 인증 정보 모두 삭제 후 로그인 페이지로 강제 이동
        console.error("Token refresh failed:", refreshError);
        localStorage.clear();
        // window.location.href는 서버 컴포넌트에서 사용 불가하므로 클라이언트에서 처리
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;