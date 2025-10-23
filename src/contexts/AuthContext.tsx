'use client';

import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { useRouter } from 'next/navigation';

// API 명세서 기반 사용자 정보 타입 정의
interface User {
  username: string;
  role: "ROLE_ADMIN" | "ROLE_MEMBER";
  enabled: boolean;
}

// Context가 제공할 값들의 타입 정의
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// Context 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider 컴포넌트
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080/api';

  // ===== [핵심 수정] 로그아웃 함수를 useEffect 외부로 분리 =====
  // useEffect 내부에서 직접 사용하거나 의존성 배열에 추가할 필요 없이 안정적으로 호출 가능
  const logoutAndRedirect = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    // 쿠키 삭제 로직도 통합
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setUser(null);
    router.push('/');
  };

  // ===== [핵심 수정] 앱 로드 시 토큰 유효성 검사 로직 강화 =====
  useEffect(() => {
    const validateToken = async () => {
      const accessToken = localStorage.getItem('accessToken');
      
      // 토큰이 없으면 즉시 로딩 종료
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        // 실제 보호된 API(알림 목록)를 호출하여 토큰 유효성 검증
        const response = await fetch(`${apiUrl}/notifications`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (response.ok) {
          // 토큰이 유효하면 사용자 정보 설정
          const username = localStorage.getItem('username');
          if (username) {
            setUser({ username, role: 'ROLE_ADMIN', enabled: true });
          } else {
            // username이 없는 비정상적인 경우 로그아웃 처리
            logoutAndRedirect();
          }
        } else {
          // 응답이 ok가 아니면(401 등) 토큰이 만료된 것이므로 로그아웃 처리
          logoutAndRedirect();
        }
      } catch (error) {
        // 네트워크 에러 등 예외 발생 시 로그아웃 처리
        console.error("Token validation failed:", error);
        logoutAndRedirect();
      } finally {
        // 모든 과정이 끝나면 로딩 상태 해제
        setIsLoading(false);
      }
    };

    validateToken();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 이 useEffect는 앱이 처음 마운트될 때 한 번만 실행되어야 합니다.

  // 로그인 함수 (변경 없음)
  const login = async (username: string, password: string) => {
    const response = await fetch(`${apiUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const accessToken = response.headers.get('Authorization')?.split(' ')[1];
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('username', username);
        document.cookie = `accessToken=${accessToken}; path=/; max-age=3600; SameSite=Lax`;

        setUser({ username, role: 'ROLE_ADMIN', enabled: true });
        router.push('/main');
      } else {
        throw new Error('응답 헤더에서 Access Token을 찾을 수 없습니다.');
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '아이디 또는 비밀번호가 일치하지 않습니다.');
    }
  };

  const value = {
    isAuthenticated: !!user,
    user,
    isLoading,
    login,
    logout: logoutAndRedirect, // 분리된 로그아웃 함수 사용
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// `useAuth` 훅 (변경 없음)
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내부에서 사용해야 합니다.');
  }
  return context;
};