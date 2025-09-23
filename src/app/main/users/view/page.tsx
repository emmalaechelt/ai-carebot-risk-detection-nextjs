"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UserSearchPage() {
  const router = useRouter();

  const [searchParams, setSearchParams] = useState({
    district: "",
    neighborhood: "",
    status: "",
    ageGroup: "",
    gender: "",
    residenceType: "",
    userIdOrder: "latest",
    userName: "",
    phoneNumber: "",
    personalId: "",
    dateFrom: "",
    dateTo: "",
    timeFrom: "",
    timeTo: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSearchParams({
      ...searchParams,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearch = async () => {
    const hasAnyValue = Object.values(searchParams).some((v) => v !== "");
    if (!hasAnyValue) {
      alert("검색 조건을 하나 이상 입력하세요.");
      return;
    }

    const query = new URLSearchParams(searchParams as Record<string, string>).toString();
    router.push(`/view/list?${query}`);
  };

  return (
    <div className="space-y-3 text-black text-center">
      <div className="p-2 bg-white rounded-lg shadow space-y-3">
        <h2 className="flex items-center justify-center font-bold text-xl">이용자 조회</h2>
        <div className="grid grid-cols-10 gap-3 items-center mr-5">
          <label>자치구</label>
          <select name="district" value={searchParams.district} onChange={handleChange} className="border rounded px-2 py-1">
            <option value="">선택</option>
            <option value="대덕구">대덕구</option>
            <option value="동구">동구</option>
            <option value="서구">서구</option>
            <option value="유성구">유성구</option>
            <option value="중구">중구</option>
          </select>

          <label>행정동</label>
          <select name="neighborhood" value={searchParams.neighborhood} onChange={handleChange} className="border rounded px-2 py-1">
            <option value="">선택</option>
          </select>

          <label>현재 상태</label>
          <select name="status" value={searchParams.status} onChange={handleChange} className="border rounded px-2 py-1">
            <option value="">선택</option>
            <option value="긴급">긴급</option>
            <option value="위험">위험</option>
            <option value="주의">주의</option>
            <option value="안전">안전</option>
          </select>

          <label>연령대</label>
          <select name="ageGroup" value={searchParams.ageGroup} onChange={handleChange} className="border rounded px-2 py-1">
            <option value="">선택</option>
            <option value="60대">60대</option>
            <option value="70대">70대</option>
            <option value="80대">80대</option>
            <option value="90대">90대</option>
            <option value="100대">100대</option>
          </select>

          <label>성별</label>
          <select name="gender" value={searchParams.gender} onChange={handleChange} className="border rounded px-2 py-1">
            <option value="">선택</option>
            <option value="남">남</option>
            <option value="여">여</option>
          </select>

          <label>거주형태</label>
          <select name="residenceType" value={searchParams.residenceType} onChange={handleChange} className="border rounded px-2 py-1">
            <option value="">선택</option>
            <option value="단독주택">단독주택</option>
            <option value="연립주택">연립주택</option>
            <option value="다가구주택">다가구주택</option>
            <option value="아파트">아파트</option>
          </select>

          <label>이용자 등록번호</label>
          <select name="userIdOrder" value={searchParams.userIdOrder} onChange={handleChange} className="border rounded px-2 py-1">
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
          </select>

          <label>이용자명</label>
          <input name="userName" value={searchParams.userName} onChange={handleChange} className="border rounded px-2 py-1" />

          <label>휴대폰 번호</label>
          <input name="phoneNumber" value={searchParams.phoneNumber} onChange={handleChange} className="border rounded px-2 py-1" />

          <label>인형번호</label>
          <input name="personalId" value={searchParams.personalId} onChange={handleChange} className="border rounded px-2 py-1" />

          <label>날짜</label>
          <input type="date" name="dateFrom" value={searchParams.dateFrom} onChange={handleChange} className="border rounded px-2 py-1" />
          <span>~</span>
          <input type="date" name="dateTo" value={searchParams.dateTo} onChange={handleChange} className="border rounded px-2 py-1" />

          <label>시간</label>
          <input type="time" name="timeFrom" value={searchParams.timeFrom} onChange={handleChange} className="border rounded px-2 py-1" />
          <span>~</span>
          <input type="time" name="timeTo" value={searchParams.timeTo} onChange={handleChange} className="border rounded px-2 py-1" />

          <div className="col-span-10 mt-1 flex items-center justify-center">
            <button onClick={handleSearch} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
              검색
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}