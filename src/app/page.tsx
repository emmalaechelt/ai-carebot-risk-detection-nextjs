"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, ChangeEvent, FormEvent, useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({ username: "", password: "" });

  useEffect(() => {
    const token = sessionStorage.getItem("jwtToken");
    if (token) router.push("/main");
  }, [router]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setCredentials(prev => ({ ...prev, [e.target.id]: e.target.value }));

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (credentials.username === "admin" && credentials.password === "admin") {
      sessionStorage.setItem("jwtToken", "dummy-token");
      sessionStorage.setItem("username", credentials.username);
      router.push("/main");
    } else {
      alert("아이디 또는 비밀번호가 틀렸습니다.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center -translate-y-3">
        <div className="flex items-center justify-center mb-3">
          <Image src="/img/logo.jpg" alt="대전시 로고" width={30} height={30} className="w-10 h-auto mr-3" />
          <h1 className="text-3xl font-bold text-black">대전시</h1>
        </div>
        <h2 className="text-3xl font-bold text-black mb-2">시니어 돌봄 관제시스템</h2>
        <p className="text-xl text-gray-500 mb-5">Senior Care Control System</p>

        <form onSubmit={handleLogin} className="border-2 border-black rounded-xl p-8 w-72 mx-auto shadow-lg">
          <h3 className="text-xl font-medium text-black mb-6">관리자 로그인</h3>
          <input id="username" type="text" placeholder="ID" value={credentials.username} onChange={handleChange}
            className="w-full border-2 border-gray-800 rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-600"/>
          <input id="password" type="password" placeholder="PASSWORD" value={credentials.password} onChange={handleChange}
            className="w-full border-2 border-gray-800 rounded-md p-2 mb-7 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-600"/>
          <button type="submit"
            className="w-1/2 py-2 font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}