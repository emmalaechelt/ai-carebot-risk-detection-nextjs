"use client";

import { useState } from "react";

export default function UserRegisterPage() {
  const [form, setForm] = useState({
    name: "",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    age: "",
    gender: "",
    phone: "",
    address: "",
    housing: [] as string[],
    deviceId: "",
    status: "",
    disease: "",
    medicine: "",
    symptoms: "",
    guardianName: "",
    guardianRelation: "",
    guardianPhone: "",
    guardianNote: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (value: string) => {
    setForm((prev) => {
      const newHousing = prev.housing.includes(value)
        ? prev.housing.filter((item) => item !== value)
        : [...prev.housing, value];
      return { ...prev, housing: newHousing };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("제출된 데이터:", form);
    alert("등록/수정 완료!");
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow max-w-5xl mx-auto text-black">
      <h1 className="text-xl text-black font-bold mb-3 text-center">이용자 등록</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본정보 */}
        <fieldset className="border rounded-lg p-4">
          <legend className="font-semibold">기본정보</legend>
          <div className="grid grid-cols-6 gap-4 items-center text-center">
            <label className="col-span-1">성함</label>
            <input name="name" value={form.name} onChange={handleChange} className="col-span-2 border p-2 rounded" />

            <label className="col-span-1">생년월일 (나이)</label>
            <div className="col-span-2 flex gap-2">
              <input name="birthYear" value={form.birthYear} onChange={handleChange} placeholder="년" className="w-20 border p-2 rounded" />
              <input name="birthMonth" value={form.birthMonth} onChange={handleChange} placeholder="월" className="w-14 border p-2 rounded" />
              <input name="birthDay" value={form.birthDay} onChange={handleChange} placeholder="일" className="w-14 border p-2 rounded" />
              <input name="age" value={form.age} onChange={handleChange} placeholder="만      세" className="w-20 border p-2 rounded" />
            </div>

            <label className="col-span-1">성별</label>
            <select name="gender" value={form.gender} onChange={handleChange} className="col-span-2 border p-2 rounded">
              <option value="">선택</option>
              <option value="남">남</option>
              <option value="여">여</option>
            </select>

            <label className="col-span-1">연락처</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="col-span-2 border p-2 rounded" />

            <label className="col-span-1">주소</label>
            <input name="address" value={form.address} onChange={handleChange} className="col-span-5 border p-2 rounded" />

            <label className="col-span-1">거주 형태</label>
            <div className="col-span-5 flex gap-8">
              {["단독주택", "연립주택", "다가구 주택", "아파트"].map((type) => (
                <label key={type} className="flex items-center gap-2">
                  <input
                    type="checkbox" className="w-5 h-5"
                    checked={form.housing.includes(type)}
                    onChange={() => handleCheckboxChange(type)}
                  />
                  {type}
                </label>
              ))}
            </div>

            <label className="col-span-1">인형번호</label>
            <input name="deviceId" value={form.deviceId} onChange={handleChange} className="col-span-2 border p-2 rounded" />

            <label className="col-span-1">현재 상태(라벨)</label>
            <input name="status" value={form.status} onChange={handleChange} className="col-span-2 border p-2 rounded" />
          </div>
        </fieldset>

        {/* 건강상태 */}
        <fieldset className="border rounded-lg p-4">
          <legend className="font-semibold">건강상태</legend>
          <div className="grid grid-cols-6 gap-4 items-center text-center">
            <label className="col-span-1">질병</label>
            <input name="disease" value={form.disease} onChange={handleChange} className="col-span-2 border p-2 rounded" />

            <label className="col-span-1">복용 약물</label>
            <input name="medicine" value={form.medicine} onChange={handleChange} className="col-span-2 border p-2 rounded" />

            <label className="col-span-1">상세 증상</label>
            <textarea name="symptoms" value={form.symptoms} onChange={handleChange} className="col-span-5 border p-2 rounded" rows={3}></textarea>
          </div>
        </fieldset>

        {/* 보호자 */}
        <fieldset className="border rounded-lg p-4">
          <legend className="font-semibold">보호자</legend>
          <div className="grid grid-cols-6 gap-4 items-center text-center">
            <label className="col-span-1">이름</label>
            <input name="guardianName" value={form.guardianName} onChange={handleChange} className="col-span-2 border p-2 rounded" />

            <label className="col-span-1">이용자와의 관계</label>
            <input name="guardianRelation" value={form.guardianRelation} onChange={handleChange} className="col-span-2 border p-2 rounded" />

            <label className="col-span-1">연락처</label>
            <input name="guardianPhone" value={form.guardianPhone} onChange={handleChange} className="col-span-2 border p-2 rounded" />

            <label className="col-span-1">참고사항</label>
            <input name="guardianNote" value={form.guardianNote} onChange={handleChange} className="col-span-5 border p-2 rounded" />
          </div>
        </fieldset>

        {/* 저장 버튼 */}
        <div className="flex items-center justify-center">
          <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            저장
          </button>
        </div>
      </form>
    </div>
  );
}
