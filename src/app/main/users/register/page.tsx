// src/app/main/users/register/page.tsx
"use client";

import { useState, useEffect, useRef, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import api from "@/lib/api";
import { Residence, SeniorSex } from "@/types";

// 생년월일 유효성 검사 함수 (2월 30일 등 없는 날짜 확인)
const isValidDate = (y: number, m: number, d: number): boolean => {
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
};

const calculateAge = (birthDate: string): number | null => {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const relationshipOptions = ["자녀", "배우자", "부모", "형제자매", "친척", "기타"];

export default function UserRegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    doll_id: "",
    name: "",
    birth_date: "",
    sex: "" as SeniorSex | "",
    phone: "",
    zip_code: "",
    address: "",
    address_detail: "",
    residence: [] as Residence[],
    status: "정상", // [수정] '현재 상태'를 form state에 포함

    diseases: "",
    medications: "",
    disease_note: "",

    guardian_name: "",
    relationship: "",
    guardian_phone: "",
    guardian_note: "",

    note: "",
  });
  const [birth, setBirth] = useState({ year: "", month: "", day: "" });
  const [age, setAge] = useState<number | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const addressDetailRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const yearNum = parseInt(birth.year, 10);
    const monthNum = parseInt(birth.month, 10);
    const dayNum = parseInt(birth.day, 10);

    // [수정] 유효한 날짜인지 검사 후 상태 업데이트
    if (isValidDate(yearNum, monthNum, dayNum)) {
      const fullDate = `${birth.year}-${birth.month.padStart(2, "0")}-${birth.day.padStart(2, "0")}`;
      setForm((prev) => ({ ...prev, birth_date: fullDate }));
      setAge(calculateAge(fullDate));
    } else {
      setForm((prev) => ({ ...prev, birth_date: "" }));
      setAge(null);
    }
  }, [birth]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleBirthChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBirth((prev) => ({ ...prev, [name]: value.replace(/\D/g, "") }));
  };
  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const formatted = value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d{1,4})?(\d{1,4})?/, (match, p1, p2, p3) => {
        let result = p1;
        if (p2) result += `-${p2}`;
        if (p3) result += `-${p3}`;
        return result;
      })
      .slice(0, 13);
    setForm((prev) => ({ ...prev, [name]: formatted }));
  };
  const handleResidenceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    const residenceValue = value as Residence;
    setForm((prev) => {
      if (checked) return { ...prev, residence: [...prev.residence, residenceValue] };
      return { ...prev, residence: prev.residence.filter((r) => r !== residenceValue) };
    });
  };
  const handleZipSearch = () => {
    new (window as any).daum.Postcode({
      oncomplete: (data: any) => {
        setForm((prev) => ({ ...prev, zip_code: data.zonecode, address: data.roadAddress }));
        addressDetailRef.current?.focus();
      },
    }).open();
  };
  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (!form.name || !form.birth_date || !form.sex || !form.phone || !form.address) {
      alert("기본정보의 필수 항목(*)을 모두 입력해주세요.");
      setIsSubmitting(false);
      return;
    }
    try {
      const formData = new FormData();
      const seniorData = { ...form, residence: form.residence.join(",") };
      formData.append("senior", new Blob([JSON.stringify(seniorData)], { type: "application/json" }));
      if (photo) formData.append("photo", photo);
      await api.post("/seniors", formData);
      alert("이용자 등록에 성공했습니다.");
      router.push("/main/users/view");
    } catch (err) {
      console.error("이용자 등록 실패:", err);
      alert("등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 스타일 ---
  const sectionTitleClass = "text-lg font-semibold text-gray-800 mb-1.5";
  const tableBorderClass = "border-gray-400";
  const tableClass = `w-full border-collapse text-sm border ${tableBorderClass}`;
  const thClass = `border ${tableBorderClass} bg-gray-50 font-medium p-2 text-center align-middle whitespace-nowrap`;
  const tdClass = `border ${tableBorderClass} p-2 align-middle`;
  const inputClass = "border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-sm w-full";
  const requiredLabel = <span className="text-red-500 ml-1">*</span>;

  return (
    <>
      <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="afterInteractive" />
      <div className="p-5 bg-white rounded-lg shadow-md max-w-5xl mx-auto text-black">
        <h1 className="text-2xl font-bold mb-4 text-center">이용자 등록</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <section>
            <h2 className={sectionTitleClass}>■ 기본정보</h2>
            <table className={tableClass}>
              <colgroup>
                <col className="w-32" /> {/* 사진 */}
                <col className="w-28" /> {/* 라벨 1 */}
                <col className="w-auto" />{/* 입력칸 1 */}
                <col className="w-32" /> {/* 라벨 2 */}
                <col className="w-auto" />{/* 입력칸 2 */}
              </colgroup>
              <tbody>
                <tr>
                  <td className={tdClass} rowSpan={5}>
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <div className="w-28 h-36 border border-dashed rounded-md flex items-center justify-center bg-gray-50">
                        {photoPreview ? <img src={photoPreview} alt="사진 미리보기" className="w-full h-full object-cover rounded-md" /> : <span className="text-gray-400 text-sm">사진</span>}
                      </div>
                      <input type="file" accept="image/*" onChange={handlePhotoChange} ref={photoInputRef} className="hidden" />
                      <button type="button" onClick={() => photoInputRef.current?.click()} className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">사진 첨부</button>
                    </div>
                  </td>
                  <th className={thClass}>이름{requiredLabel}</th>
                  <td className={tdClass}><input name="name" value={form.name} onChange={handleChange} className={inputClass} required /></td>
                  <th className={thClass}>생년월일 (나이){requiredLabel}</th>
                  <td className={tdClass}>
                    <div className="flex items-center gap-1">
                      <input name="year" value={birth.year} onChange={handleBirthChange} className={`${inputClass} w-20 text-center`} placeholder="YYYY" maxLength={4} required />
                      <span>년</span>
                      <input name="month" value={birth.month} onChange={handleBirthChange} className={`${inputClass} w-14 text-center`} placeholder="MM" maxLength={2} required />
                      <span>월</span>
                      <input name="day" value={birth.day} onChange={handleBirthChange} className={`${inputClass} w-14 text-center`} placeholder="DD" maxLength={2} required />
                      <span>일 (만</span>
                      <input readOnly value={age ?? ""} className={`${inputClass} w-12 text-center bg-gray-100 mx-1`} />
                      <span>세)</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th className={thClass}>성별{requiredLabel}</th>
                  <td className={tdClass}><select name="sex" value={form.sex} onChange={handleChange} className={inputClass} required><option value="">선택</option><option value="MALE">남</option><option value="FEMALE">여</option></select></td>
                  <th className={thClass}>연락처{requiredLabel}</th>
                  <td className={tdClass}><input name="phone" value={form.phone} onChange={handlePhoneChange} className={inputClass} placeholder="010-1234-5678" required /></td>
                </tr>
                <tr>
                  <th className={thClass}>현재 상태</th>
                  <td className={tdClass}><input value={form.status} readOnly className={`${inputClass} bg-gray-100 text-center`} /></td>
                  <th className={thClass}>인형 아이디</th>
                  <td className={tdClass}><input name="doll_id" value={form.doll_id} onChange={handleChange} className={inputClass} /></td>
                </tr>
                <tr>
                  <th className={thClass}>주소{requiredLabel}</th>
                  <td className={tdClass} colSpan={3}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input name="zip_code" value={form.zip_code} readOnly placeholder="우편번호" className={`${inputClass} w-24 bg-gray-100`} />
                        <button type="button" onClick={handleZipSearch} className="bg-blue-500 text-white px-4 py-1.5 rounded-md text-sm hover:bg-blue-600 whitespace-nowrap">우편번호 검색</button>
                        <input name="address" value={form.address} readOnly placeholder="주소" className={`${inputClass} bg-gray-100 flex-grow`} />
                      </div>
                      <input name="address_detail" ref={addressDetailRef} value={form.address_detail} onChange={handleChange} placeholder="상세주소" className={inputClass} />
                    </div>
                  </td>
                </tr>
                <tr>
                  <th className={thClass}>거주 형태</th>
                  <td className={tdClass} colSpan={3}>
                    <div className="flex items-center gap-4 flex-wrap py-1">
                      {Object.values(Residence).map((res) => (<label key={res} className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" value={res} checked={form.residence.includes(res)} onChange={handleResidenceChange} className="w-4 h-4" />{res}</label>))}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* [수정] 아래 표들의 colgroup 구조를 위와 다르게 하여 라인 정렬 */}
          <section>
            <h2 className={sectionTitleClass}>■ 건강상태</h2>
            <table className={tableClass}>
              <colgroup>
                <col className="w-32" /> {/* 라벨 1 (사진 너비와 동일) */}
                <col className="w-auto" />{/* 입력칸 1 */}
                <col className="w-[10.5rem]" /> {/* 라벨 2 (위의 라벨너비+패딩 등) */}
                <col className="w-auto" />{/* 입력칸 2 */}
              </colgroup>
              <tbody>
                <tr>
                  <th className={thClass}>질병</th>
                  <td className={tdClass}><input name="diseases" value={form.diseases} onChange={handleChange} className={inputClass} /></td>
                  <th className={thClass}>복용 약물</th>
                  <td className={tdClass}><input name="medications" value={form.medications} onChange={handleChange} className={inputClass} /></td>
                </tr>
                <tr>
                  <th className={thClass}>상세 증상</th>
                  <td className={tdClass} colSpan={3}><textarea name="disease_note" value={form.disease_note} onChange={handleChange} rows={3} className={inputClass}></textarea></td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className={sectionTitleClass}>■ 보호자</h2>
            <table className={tableClass}>
              <colgroup>
                <col className="w-32" />
                <col className="w-auto" />
                <col className="w-[10.5rem]" />
                <col className="w-auto" />
              </colgroup>
              <tbody>
                <tr>
                  <th className={thClass}>이름</th>
                  <td className={tdClass}><input name="guardian_name" value={form.guardian_name} onChange={handleChange} className={inputClass} /></td>
                  <th className={thClass}>연락처</th>
                  <td className={tdClass}><input name="guardian_phone" value={form.guardian_phone} onChange={handlePhoneChange} className={inputClass} placeholder="010-1234-5678" /></td>
                </tr>
                <tr>
                  <th className={thClass}>이용자와의 관계</th>
                  <td className={tdClass}>
                    <select name="relationship" value={form.relationship} onChange={handleChange} className={inputClass}>
                      <option value="">선택</option>
                      {relationshipOptions.map((option) => (<option key={option} value={option}>{option}</option>))}
                    </select>
                  </td>
                  <th className={thClass}>참고사항</th>
                  <td className={tdClass}><input name="guardian_note" value={form.guardian_note} onChange={handleChange} className={inputClass} /></td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className={sectionTitleClass}>■ 이외 참고사항</h2>
            <table className={tableClass}>
              <colgroup>
                <col className="w-32" />
                <col className="w-auto" />
              </colgroup>
              <tbody>
                <tr>
                  <th className={thClass}>참고사항</th>
                  <td className={tdClass}><textarea name="note" value={form.note} onChange={handleChange} rows={3} className={inputClass}></textarea></td>
                </tr>
              </tbody>
            </table>
          </section>

          <div className="flex justify-center pt-2">
            <button type="submit" disabled={isSubmitting} className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
              {isSubmitting ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}