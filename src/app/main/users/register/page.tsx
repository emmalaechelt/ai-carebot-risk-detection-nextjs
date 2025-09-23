"use client";

import { useState, useEffect } from "react";

export default function UserRegisterPage() {
  const [form, setForm] = useState({
    name: "",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    age: "",
    gender: "",
    phone: "",
    addressZip: "",
    addressSearch: "",
    addressDetail: "",
    housing: [] as string[],
    deviceId: "",
    status: "정상",
    disease: "",
    medicine: "",
    symptoms: "",
    guardianName: "",
    guardianRelation: "",
    guardianPhone: "",
    guardianNote: "",
  });

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value.replace(/\D/g, "") }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length < 4) value = value;
    else if (value.length < 7) value = value.replace(/(\d{3})(\d+)/, "$1-$2");
    else if (value.length < 11) value = value.replace(/(\d{3})(\d{3})(\d+)/, "$1-$2-$3");
    else value = value.replace(/(\d{3})(\d{4})(\d+)/, "$1-$2-$3");
    setForm((prev) => ({ ...prev, phone: value }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const { birthYear, birthMonth, birthDay } = form;
    if (birthYear && birthMonth && birthDay) {
      const today = new Date();
      const birth = new Date(Number(birthYear), Number(birthMonth) - 1, Number(birthDay));
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      setForm((prev) => ({ ...prev, age: age.toString() }));
    }
  }, [form.birthYear, form.birthMonth, form.birthDay]);

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

  const handleZipSearch = () => {
    setForm((prev) => ({
      ...prev,
      addressZip: "12345",
      addressSearch: "서울특별시 강남구 테헤란로 123",
    }));
  };

  const inputClass =
    "border border-gray-300 rounded px-2 py-1 w-full text-center focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white";
  const tableClass = "w-full border-collapse border border-gray-300 text-center text-sm";
  const thTdClass = "border border-gray-300 px-2 py-2 align-middle";

  return (
    <div className="p-4 md:p-6 bg-white rounded-xl shadow max-w-5xl mx-auto text-black">
      <h1 className="text-2xl font-bold mb-2 text-center">이용자 등록</h1>

      <form onSubmit={handleSubmit} className="space-y-6 overflow-x-auto">

        {/* 기본정보 */}
        <div>
          <div className="flex items-center mb-2 mt-2">
            <div className="w-1 bg-blue-500 h-6 mr-2"></div>
            <span className="font-semibold text-lg">기본정보</span>
          </div>
          <table className={tableClass}>
            <tbody>
              <tr>
                <th className={thTdClass + " w-28"}>성함</th>
                <td className={thTdClass}>
                  <input name="name" value={form.name} onChange={handleChange} className={inputClass} />
                </td>
                <th className={thTdClass + " w-32"}>생년월일 (나이)</th>
                <td className={thTdClass}>
                  <div className="flex items-center justify-center gap-2">
                    <input name="birthYear" value={form.birthYear} onChange={handleNumberInput} className="w-24 border-gray-300 border px-1 py-1 rounded text-center" placeholder="년" />
                    년
                    <input name="birthMonth" value={form.birthMonth} onChange={handleNumberInput} className="w-20 border-gray-300 border px-1 py-1 rounded text-center" placeholder="월" />
                    월
                    <input name="birthDay" value={form.birthDay} onChange={handleNumberInput} className="w-20 border-gray-300 border px-1 py-1 rounded text-center" placeholder="일" />
                    일&nbsp;&nbsp;(
                    <input name="age" value={form.age} readOnly className="w-16 border-gray-300 border px-1 py-1 rounded text-center bg-gray-100 mx-1" />
                    세)
                  </div>
                </td>
              </tr>

              <tr>
                <th className={thTdClass}>성별</th>
                <td className={thTdClass}>
                  <select name="gender" value={form.gender} onChange={handleChange} className={inputClass}>
                    <option value="">선택</option>
                    <option value="남">남</option>
                    <option value="여">여</option>
                  </select>
                </td>
                <th className={thTdClass}>연락처</th>
                <td className={thTdClass}>
                  <input name="phone" value={form.phone} onChange={handlePhoneChange} className={inputClass} placeholder="010-1234-5678" />
                </td>
              </tr>

              <tr>
                <th className={thTdClass}>주소</th>
                <td className={thTdClass} colSpan={3}>
                  <div className="flex gap-2 items-center flex-wrap">
                    <input name="addressZip" value={form.addressZip} onChange={handleNumberInput} className="border border-gray-300 px-2 py-1 rounded w-24 text-center" placeholder="우편번호" />
                    <button type="button" className="px-2 py-1 bg-blue-500 text-white rounded" onClick={handleZipSearch}>
                      우편번호 검색
                    </button>
                    <input name="addressSearch" value={form.addressSearch} readOnly className="border border-gray-300 px-2 py-1 rounded flex-1 bg-white" placeholder="주소" />
                    <input name="addressDetail" value={form.addressDetail} onChange={handleChange} className="border border-gray-300 px-2 py-1 rounded w-1/4" placeholder="상세주소" />
                  </div>
                </td>
              </tr>

              <tr>
                <th className={thTdClass}>거주 형태</th>
                <td className={thTdClass} colSpan={3}>
                  <div className="flex gap-3 justify-center flex-wrap">
                    {["단독주택", "연립주택", "다가구 주택", "아파트"].map((type) => (
                      <label key={type} className="flex items-center gap-2 text-base">
                        <input type="checkbox" checked={form.housing.includes(type)} onChange={() => handleCheckboxChange(type)} className="w-4 h-4" />
                        {type}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>

              <tr>
                <th className={thTdClass}>인형번호</th>
                <td className={thTdClass}>
                  <input name="deviceId" value={form.deviceId} onChange={handleChange} className={inputClass} />
                </td>
                <th className={thTdClass}>현재 상태(라벨)</th>
                <td className={thTdClass}>
                  <input name="status" value={form.status} readOnly className={inputClass + " bg-gray-100"} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 건강상태 */}
        <div>
          <div className="flex items-center mb-2 mt-2">
            <div className="w-1 bg-blue-500 h-6 mr-2"></div>
            <span className="font-semibold text-lg">건강상태</span>
          </div>
          <table className={tableClass}>
            <tbody>
              <tr>
                <th className={thTdClass + " w-28"}>질병</th>
                <td className={thTdClass}>
                  <input name="disease" value={form.disease} onChange={handleChange} className={inputClass} />
                </td>
                <th className={thTdClass + " w-28"}>복용 약물</th>
                <td className={thTdClass}>
                  <input name="medicine" value={form.medicine} onChange={handleChange} className={inputClass} />
                </td>
              </tr>
              <tr>
                <th className={thTdClass}>상세 증상</th>
                <td className={thTdClass} colSpan={3}>
                  <textarea name="symptoms" value={form.symptoms} onChange={handleChange} className={inputClass + " h-20"} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 보호자 */}
        <div>
          <div className="flex items-center mb-2 mt-2">
            <div className="w-1 bg-blue-500 h-6 mr-2"></div>
            <span className="font-semibold text-lg">보호자</span>
          </div>
          <table className={tableClass}>
            <tbody>
              <tr>
                <th className={thTdClass + " w-28"}>이름</th>
                <td className={thTdClass}>
                  <input name="guardianName" value={form.guardianName} onChange={handleChange} className={inputClass} />
                </td>
                <th className={thTdClass + " w-28"}>이용자와의 관계</th>
                <td className={thTdClass}>
                  <input name="guardianRelation" value={form.guardianRelation} onChange={handleChange} className={inputClass} />
                </td>
              </tr>
              <tr>
                <th className={thTdClass + " w-28"}>연락처</th>
                <td className={thTdClass}>
                  <input name="guardianPhone" value={form.guardianPhone} onChange={handlePhoneChange} className={inputClass} />
                </td>
                <th className={thTdClass + " w-28"}>참고사항</th>
                <td className={thTdClass}>
                  <input name="guardianNote" value={form.guardianNote} onChange={handleChange} className={inputClass} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-center mt-4">
          <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            저장
          </button>
        </div>
      </form>
    </div>
  );
}