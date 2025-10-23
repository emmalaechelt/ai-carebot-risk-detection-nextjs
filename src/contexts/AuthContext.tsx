// src/contexts/AuthContext.tsx

'use client';

import { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  username: string;
  role: "ROLE_ADMIN" | "ROLE_MEMBER";
  enabled: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8080/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // ✅ [수정 1] useEffect 밖으로 logout 함수를 빼내고, useCallback 의존성에서 router 제거
  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    setUser(null);
    // router.push는 useEffect 밖에서 호출될 때 의존성 문제가 없으므로,
    // useCallback의 의존성 배열에서 제거하여 불필요한 함수 재생성을 방지합니다.
    router.push('/');
  }, [router]);


  // ✅ [수정 2] useEffect의 의존성 배열을 빈 배열 `[]`로 변경
  // 이렇게 하면 이 코드는 컴포넌트가 처음 마운트될 때 "단 한 번만" 실행되어 안정성이 보장됩니다.
  useEffect(() => {
    const validateToken = async () => {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/notifications`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (response.ok) {
          const username = localStorage.getItem('username');
          if (username) {
            setUser({ username, role: 'ROLE_ADMIN', enabled: true });
          } else {
            // username이 없는 비정상적인 경우, 토큰 정보도 신뢰할 수 없으므로 로그아웃합니다.
            localStorage.removeItem('accessToken');
            setUser(null);
          }
        } else {
          // 401 등 서버가 거부하면 토큰이 만료된 것이므로 로그아웃합니다.
          localStorage.removeItem('accessToken');
          localStorage.removeItem('username');
          setUser(null);
        }
      } catch (error) {
        console.error("Token validation request failed:", error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('username');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, []); // <-- 의존성 배열을 비워 오직 한 번만 실행되도록 보장합니다.

  const login = async (username: string, password: string) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const accessToken = response.headers.get('Authorization')?.split(' ')[1];
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('username', username);
        setUser({ username, role: 'ROLE_ADMIN', enabled: true });
        router.push('/main');
      } else {
        throw new Error('Access Token not found in response header');
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed');
    }
  };

  const value = { isAuthenticated: !!user, user, isLoading, login, logout, };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); }
  return context;
};