import axios from 'axios';

/**
 * ✅ 1. 애플리케이션 전체에서 사용할 단일 axios 인스턴스 생성
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080/api',
  withCredentials: true, // 쿠키(Refresh Token) 전송을 위해 필수
});

/**
 * ✅ 2. 요청 인터셉터 (Request Interceptor)
 * - 모든 API 요청 헤더에 localStorage의 Access Token을 자동으로 추가합니다.
 */
api.interceptors.request.use(
  (config) => {
    // 서버 사이드 렌더링 환경에서는 localStorage가 없으므로 체크합니다.
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        // 가끔 저장될 수 있는 따옴표를 제거합니다.
        config.headers.Authorization = `Bearer ${token.replace(/"/g, '')}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * ✅ 3. 응답 인터셉터 (Response Interceptor)
 * - API 응답이 401(Unauthorized) 에러일 경우, Refresh Token으로 Access Token 자동 갱신을 시도합니다.
 */
api.interceptors.response.use(
  (response) => response, // 성공적인 응답은 그대로 반환
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고, 재시도한 요청이 아닐 경우에만 토큰 갱신 로직을 실행합니다.
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // 재시도 플래그 설정

      try {
        // Refresh Token(쿠키)을 사용하여 새로운 Access Token을 요청합니다.
        const refreshResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080/api'}/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.headers.authorization?.split(' ')[1];

        if (newAccessToken) {
          localStorage.setItem('accessToken', newAccessToken);
          
          // 새로 발급받은 토큰으로 기본 헤더와 원래 요청의 헤더를 모두 업데이트합니다.
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // 실패했던 원래 요청을 새로운 토큰으로 재시도합니다.
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh Token 갱신 자체를 실패한 경우 (ex: Refresh Token 만료)
        localStorage.removeItem('accessToken');
        localStorage.removeItem('username');
        delete api.defaults.headers.common['Authorization'];

        // AuthContext가 로그아웃 처리를 할 수 있도록 커스텀 이벤트를 발생시킵니다.
        // window.location.href 보다 앱의 상태를 일관성 있게 관리할 수 있는 방법입니다.
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sessionExpired'));
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * ✅ 4. 다른 파일에서 이 api 인스턴스를 가져와 사용할 수 있도록 default로 내보냅니다.
 */
export default api;