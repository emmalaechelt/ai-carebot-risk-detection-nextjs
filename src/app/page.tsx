"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, ChangeEvent, FormEvent } from "react";

export default function Login() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  // input 변경 핸들러
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.id]: e.target.value });
  };

  // 로그인 버튼 클릭 / 폼 제출
  const loginButton = async (e: FormEvent) => {
    e.preventDefault(); // 새로고침 방지
    try {
      const response = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const jwtToken = response.headers.get("Authorization");
        if (jwtToken) {
          sessionStorage.setItem("jwtToken", jwtToken);
          sessionStorage.setItem("username", credentials.username==="admin1" && credentials.password==="admin1" ? "admin1" : "user");
        }
        router.push("/main");
      } else {
        alert("로그인 실패!");
      }
    } catch (error) {
      console.error("로그인 오류!", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center -translate-y-3">
        {/* 로고 + "대전시" */}
        <div className="flex items-center justify-center mb-3">
          <Image
            src="/img/logo.jpg"
            alt="대전시 로고"
            width={30}
            height={30}
            className="w-10 h-auto relative right-3"
          />
          <h1 className="text-3xl text-black font-bold">대전시</h1>
        </div>

        <h2 className="text-3xl text-black font-bold mb-2">
          시니어 돌봄 관제시스템
        </h2>
        <p className="text-xl text-gray-500 mb-5">
          Senior Care Control System
        </p>

        {/* 로그인 폼 */}
        <form
          onSubmit={loginButton}
          className="border-2 border-black rounded-xl p-8 w-70 mx-auto shadow-lg"
        >
          <h3 className="text-xl text-black font-medium mb-6">관리자 로그인</h3>
          <input
            id="username"
            type="text"
            placeholder="ID"
            className="w-full border-2 border-gray-800 rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-600"
            value={credentials.username}
            onChange={handleChange}
          />
          <input
            id="password"
            type="password"
            placeholder="PASSWORD"
            className="w-full border-2 border-gray-800 rounded-md p-2 mb-7 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-600"
            value={credentials.password}
            onChange={handleChange}
          />
          <button
            type="submit"
            className="w-1/2 font-semibold bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition"
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}
