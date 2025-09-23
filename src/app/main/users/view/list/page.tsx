"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface User {
  id: number;
  user_name: string;
  phone_number: string;
  district: string;
  status: string;
}

export default function UserListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // 검색 조건 상태
  const [filters, setFilters] = useState<Record<string, string>>({});

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 초기화: URL query → filters
  useEffect(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    setFilters(params);
  }, [searchParams]);

  // API 요청
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const res = await fetch("/api/user/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
      const data = await res.json();
      setUsers(data);
      setLoading(false);
    };

    if (Object.keys(filters).length > 0) {
      fetchData();
    }
  }, [filters]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentUsers = users.slice(startIdx, startIdx + itemsPerPage);

  // 검색 조건 변경
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // 검색 실행
  const handleSearch = () => {
    const query = new URLSearchParams(filters).toString();
    router.push(`/view/list?${query}`);
  };

  return (
    <div className="p-5 space-y-5">
      {/* 검색 영역 */}
      <div className="p-4 bg-white rounded-lg shadow space-y-3">
        <h2 className="flex items-center justify-center font-bold text-xl">이용자 조회</h2>
        <div className="grid grid-cols-10 gap-3 items-center mr-5">
          <label>자치구</label>
          <select name="district" value={filters.district || ""} onChange={handleChange} className="border rounded px-2 py-1">
            <option value="">선택</option>
            <option value="대덕구">대덕구</option>
            <option value="동구">동구</option>
            <option value="서구">서구</option>
            <option value="유성구">유성구</option>
            <option value="중구">중구</option>
          </select>

          <label>행정동</label>
          <input name="neighborhood" value={filters.neighborhood || ""} onChange={handleChange} className="border rounded px-2 py-1" />

          <label>현재 상태</label>
          <select name="status" value={filters.status || ""} onChange={handleChange} className="border rounded px-2 py-1">
            <option value="">선택</option>
            <option value="긴급">긴급</option>
            <option value="위험">위험</option>
            <option value="주의">주의</option>
            <option value="안전">안전</option>
          </select>

          <label>연령대</label>
          <select name="ageGroup" value={filters.ageGroup || ""} onChange={handleChange} className="border rounded px-2 py-1">
            <option value="">선택</option>
            <option value="60대">60대</option>
            <option value="70대">70대</option>
            <option value="80대">80대</option>
            <option value="90대">90대</option>
            <option value="100대">100대</option>
          </select>

          <label>성별</label>
          <select name="gender" value={filters.gender || ""} onChange={handleChange} className="border rounded px-2 py-1">
            <option value="">선택</option>
            <option value="남">남</option>
            <option value="여">여</option>
          </select>

          <label>거주형태</label>
          <select name="residenceType" value={filters.residenceType || ""} onChange={handleChange} className="border rounded px-2 py-1">
            <option value="">선택</option>
            <option value="단독주택">단독주택</option>
            <option value="연립주택">연립주택</option>
            <option value="다가구주택">다가구주택</option>
            <option value="아파트">아파트</option>
          </select>

          <label>이용자 등록번호</label>
          <select name="userIdOrder" value={filters.userIdOrder || "latest"} onChange={handleChange} className="border rounded px-2 py-1">
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
          </select>

          <label>이용자명</label>
          <input name="userName" value={filters.userName || ""} onChange={handleChange} className="border rounded px-2 py-1" />

          <label>휴대폰 번호</label>
          <input name="phoneNumber" value={filters.phoneNumber || ""} onChange={handleChange} className="border rounded px-2 py-1" />

          <label>인형번호</label>
          <input name="personalId" value={filters.personalId || ""} onChange={handleChange} className="border rounded px-2 py-1" />

          <label>날짜</label>
          <input type="date" name="dateFrom" value={filters.dateFrom || ""} onChange={handleChange} className="border rounded px-2 py-1" />
          <span>~</span>
          <input type="date" name="dateTo" value={filters.dateTo || ""} onChange={handleChange} className="border rounded px-2 py-1" />

          <label>시간</label>
          <input type="time" name="timeFrom" value={filters.timeFrom || ""} onChange={handleChange} className="border rounded px-2 py-1" />
          <span>~</span>
          <input type="time" name="timeTo" value={filters.timeTo || ""} onChange={handleChange} className="border rounded px-2 py-1" />

          <div className="col-span-10 mt-1 flex items-center justify-center">
            <button onClick={handleSearch} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
              검색
            </button>
          </div>
        </div>
      </div>

      {/* 결과 테이블 */}
      <div>
        <h1 className="text-xl font-bold mb-4">검색 결과</h1>
        {loading ? (
          <div>로딩 중...</div>
        ) : users.length === 0 ? (
          <div>검색 결과가 없습니다.</div>
        ) : (
          <>
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">ID</th>
                  <th className="border px-2 py-1">이름</th>
                  <th className="border px-2 py-1">전화번호</th>
                  <th className="border px-2 py-1">자치구</th>
                  <th className="border px-2 py-1">상태</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => router.push(`/view/${u.id}`)}
                  >
                    <td className="border px-2 py-1">{u.id}</td>
                    <td className="border px-2 py-1">{u.user_name}</td>
                    <td className="border px-2 py-1">{u.phone_number}</td>
                    <td className="border px-2 py-1">{u.district}</td>
                    <td className="border px-2 py-1">{u.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 페이지네이션 */}
            <div className="flex justify-center mt-4 gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                이전
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 border rounded ${
                    currentPage === i + 1 ? "bg-blue-500 text-white" : ""
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                다음
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}