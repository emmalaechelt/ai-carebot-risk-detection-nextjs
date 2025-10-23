// src/contexts/AuthContext.tsx
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

// Context 생성 (초기값은 undefined)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider 컴포넌트
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 앱 로드 시 토큰 유효성 검사
  useEffect(() => {
    // handleLogout을 useEffect 내부에서 정의하거나, 의존성 배열에 추가해야 합니다.
    // 안전하게 logout 함수를 직접 사용하도록 수정합니다.
    const logoutAndRedirect = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('username');
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        setUser(null);
        router.push('/');
    };

    const validateToken = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        try {
          const username = localStorage.getItem('username');
          if (username) {
            setUser({ username, role: 'ROLE_ADMIN', enabled: true });
          } else {
             logoutAndRedirect();
          }
        } catch (error) {
          logoutAndRedirect();
        }
      }
      setIsLoading(false);
    };
    validateToken();
  }, [router]); // router를 의존성 배열에 추가


  // ===== [수정] 로그인 함수: 쿠키 저장 로직 추가 =====
  const login = async (username: string, password: string) => {
    // API 명세서의 기본 URL 사용 (환경 변수 또는 직접 명시)
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080/api';

    const response = await fetch(`${apiUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const accessToken = response.headers.get('Authorization')?.split(' ')[1];
      if (accessToken) {
        // 기존 localStorage 저장
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('username', username);

        // [핵심 추가] 서버(API Route)가 읽을 수 있도록 쿠키에도 저장
        document.cookie = `accessToken=${accessToken}; path=/; max-age=3600; SameSite=Lax`; // 1시간 유효

        setUser({ username, role: 'ROLE_ADMIN', enabled: true });
        router.push('/main');
      } else {
        throw new Error('응답 헤더에서 Access Token을 찾을 수 없습니다.');
      }
    } else {
      // API 명세서 기반 에러 처리
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '아이디 또는 비밀번호가 일치하지 않습니다.');
    }
  };

  // ===== [수정] 로그아웃 함수: 쿠키 삭제 로직 추가 =====
  const handleLogout = () => {
    // localStorage에서 정보 제거
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');

    // [핵심 추가] 쿠키 만료시켜서 삭제
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    setUser(null);
    router.push('/'); // 로그인 페이지로 리디렉션
  };

  const value = {
    isAuthenticated: !!user,
    user,
    isLoading,
    login,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// `useAuth` 훅 (기존 `hooks/useAuth.ts`의 내용)
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내부에서 사용해야 합니다.');
  }
  return context;
};