"use client";

import { useState, useEffect, useRef, ChangeEvent, FormEvent, FocusEvent } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Residence, SeniorSex } from "@/types";
// axios 기본 import는 유지합니다.
import axios from "axios";

// Daum 우편번호 API를 위한 타입 선언
declare global {
  interface Window {
    daum: any;
  }
}

// ... (isValidDate, calculateAge 등 다른 함수들은 이전과 동일합니다)
const isValidDate = (y: number, m: number, d: number): boolean => {
  const date = new Date(y, m - 1, d);
  const today = new Date();
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d && date <= today;
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
    doll_id: "", name: "", birth_date: "", sex: "" as SeniorSex | "",
    phone: "", zip_code: "", address: "", address_detail: "",
    residence: "" as Residence | "",
    status: "정상", diseases: "",
    medications: "", disease_note: "", guardian_name: "", relationship: "",
    guardian_phone: "", guardian_note: "", note: "",
  });
  const [birth, setBirth] = useState({ year: "", month: "", day: "" });
  const [age, setAge] = useState<number | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const addressDetailRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    const scriptUrl = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    const existingScript = document.querySelector(`script[src="${scriptUrl}"]`);
    if (existingScript) {
      setTimeout(() => {
        if (window.daum && window.daum.Postcode) setIsScriptLoaded(true);
      }, 100);
      return;
    }
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => console.error("Daum 우편번호 스크립트를 로드하는데 실패했습니다.");
    document.head.appendChild(script);
    return () => {
      const a_script = document.querySelector(`script[src="${scriptUrl}"]`);
      if (a_script) document.head.removeChild(a_script);
    };
  }, []);

  useEffect(() => {
    const { year, month, day } = birth;
    if (year.length === 4 && month.length > 0 && day.length > 0) {
      const yearNum = parseInt(year, 10), monthNum = parseInt(month, 10), dayNum = parseInt(day, 10);
      if (isValidDate(yearNum, monthNum, dayNum)) {
        const fullDate = `${year}-${String(monthNum).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
        setForm((prev) => ({ ...prev, birth_date: fullDate }));
        setAge(calculateAge(fullDate));
      } else {
        setForm((prev) => ({ ...prev, birth_date: "" })); setAge(null);
      }
    } else {
      setForm((prev) => ({ ...prev, birth_date: "" })); setAge(null);
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
  
  const handleBirthBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!value) return;
    let numValue = parseInt(value, 10), newValue = value;
    if (name === "month") {
      if (numValue < 1) newValue = "01"; else if (numValue > 12) newValue = "12";
      else newValue = String(numValue).padStart(2, '0');
    }
    if (name === "day") {
      if (numValue < 1) newValue = "01"; else if (numValue > 31) newValue = "31";
      else newValue = String(numValue).padStart(2, '0');
    }
    if (newValue !== value) setBirth((prev) => ({ ...prev, [name]: newValue }));
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const formatted = value.replace(/\D/g, "").replace(/(\d{3})(\d{1,4})?(\d{1,4})?/, (_, p1, p2, p3) => {
      let result = p1; if (p2) result += `-${p2}`; if (p3) result += `-${p3}`; return result;
    }).slice(0, 13);
    setForm((prev) => ({ ...prev, [name]: formatted }));
  };
  
  const handleZipSearch = () => {
    if (isScriptLoaded && window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: (data: any) => {
          setForm((prev) => ({ ...prev, zip_code: data.zonecode, address: data.roadAddress }));
          addressDetailRef.current?.focus();
        },
      }).open();
    } else {
      alert("우편번호 검색 서비스가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.");
    }
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

    if (!form.name || !form.birth_date || !form.sex || !form.phone || !form.address || !form.doll_id || !form.guardian_name || !form.guardian_phone || !form.relationship) {
      alert("필수 항목(*)을 모두 입력해주세요.");
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();

      if (photo) {
        formData.append("photo", photo);
      }

      const seniorDto = {
        doll_id: form.doll_id,
        name: form.name,
        birth_date: form.birth_date,
        sex: form.sex,
        phone: form.phone,
        zip_code: form.zip_code,
        address: form.address,
        address_detail: form.address_detail,
        residence: form.residence || null,
        status: form.status,
        diseases: form.diseases,
        medications: form.medications,
        disease_note: form.disease_note,
        guardian_name: form.guardian_name,
        relationship: form.relationship,
        guardian_phone: form.guardian_phone,
        guardian_note: form.guardian_note,
        note: form.note,
      };
      
      const jsonBlob = new Blob([JSON.stringify(seniorDto)], {
        type: "application/json",
      });

      formData.append("senior", jsonBlob);
      
      await api.post("/seniors", formData);
      
      alert("이용자 등록에 성공했습니다.");
      router.push("/main/users/view");

    // ▼▼▼▼▼ isAxiosError를 사용하지 않는, 가장 안정적인 오류 처리 방식으로 수정 ▼▼▼▼▼
    } catch (err: unknown) { // err의 타입을 unknown으로 명시
      console.error("이용자 등록 실패:", err);
      
      let alertMessage = "등록 중 알 수 없는 오류가 발생했습니다.";

      // 1. err가 실제로 객체인지, 그리고 'response' 속성을 가지고 있는지 직접 확인합니다.
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as any).response // response 속성이 null이나 undefined가 아닌지 추가 확인
      ) {
        // 2. 위 조건이 참이면, err를 response 속성을 가진 객체로 간주하고 안전하게 접근합니다.
        const responseData = (err as { response: { data?: any } }).response.data;
        console.error("서버 응답 데이터:", responseData);
        
        // 서버가 보낸 에러 메시지가 있다면 사용하고, 없다면 일반 메시지를 사용합니다.
        if (responseData && responseData.message) {
          alertMessage = `등록 실패: ${responseData.message}`;
        } else {
          alertMessage = "등록 실패: 서버에서 오류가 발생했습니다.";
        }
      } else if (err instanceof Error) {
        // Axios 오류가 아닌 일반적인 자바스크립트 오류일 경우를 처리합니다.
        alertMessage = `오류 발생: ${err.message}`;
      }

      alert(alertMessage);
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    } finally {
      setIsSubmitting(false);
    }
  };

  const sectionTitleClass = "text-lg font-semibold text-gray-800 mb-1.5";
  const tableBorderClass = "border-gray-400";
  const tableClass = `w-full border-collapse text-sm border ${tableBorderClass}`;
  const thClass = `border ${tableBorderClass} bg-gray-50 font-medium p-2 text-center align-middle whitespace-nowrap`;
  const tdClass = `border ${tableBorderClass} p-2 align-middle`;
  
  const inputClass = "border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm";
  const requiredLabel = <span className="text-red-500 ml-1">*</span>;
  
  const filledInputClass = "bg-blue-50";

  return (
    <>
      <div className="p-5 bg-white rounded-lg shadow-md max-w-5xl mx-auto text-black">
        <h1 className="text-2xl font-bold mb-4 text-center">이용자 등록</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <section>
            <h2 className={sectionTitleClass}>■ 기본정보</h2>
            <table className={tableClass}>
              <colgroup><col className="w-34" /><col className="w-28" /><col className="w-45" /><col className="w-35" /><col className="w-auto" /></colgroup>
              <tbody>
                <tr>
                  <td className={tdClass} rowSpan={5}>
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                      <div className="w-28 h-36 border border-dashed rounded-md flex items-center justify-center bg-gray-50">
                        {photoPreview ? <img src={photoPreview} alt="사진 미리보기" className="w-full h-full object-cover rounded-md" /> : <span className="text-gray-400 text-sm">사진</span>}
                      </div>
                      <input type="file" accept="image/*" onChange={handlePhotoChange} ref={photoInputRef} className="hidden" />
                      <button type="button" onClick={() => photoInputRef.current?.click()} className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">사진 첨부</button>
                    </div>
                  </td>
                  <th className={thClass}>이름{requiredLabel}</th>
                  <td className={tdClass}><input name="name" value={form.name} onChange={handleChange} className={`${inputClass} w-full ${form.name ? filledInputClass : 'bg-white'}`} required /></td>
                  <th className={thClass}>생년월일 (나이){requiredLabel}</th>
                  <td className={tdClass}>
                    <div className="flex items-center gap-1">
                      <input name="year" value={birth.year} onChange={handleBirthChange} onBlur={handleBirthBlur} className={`${inputClass} w-20 text-center ${birth.year ? filledInputClass : 'bg-white'}`} placeholder="YYYY" maxLength={4} required /> <span className="mr-2">년</span>
                      <input name="month" value={birth.month} onChange={handleBirthChange} onBlur={handleBirthBlur} className={`${inputClass} w-14 text-center ${birth.month ? filledInputClass : 'bg-white'}`} placeholder="MM" maxLength={2} required /> <span className="mr-2">월</span>
                      <input name="day" value={birth.day} onChange={handleBirthChange} onBlur={handleBirthBlur} className={`${inputClass} w-14 text-center ${birth.day ? filledInputClass : 'bg-white'}`} placeholder="DD" maxLength={2} required /> <span className="mr-2">일</span>
                      <span>(만</span>
                      <input readOnly value={age ?? ""} className={`${inputClass} w-15 text-center mx-1 ${age !== null ? filledInputClass : 'bg-white'}`} />
                      <span>세)</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th className={thClass}>성별{requiredLabel}</th>
                  <td className={tdClass}>
                    <select name="sex" value={form.sex} onChange={handleChange} className={`${inputClass} w-full bg-white`} required>
                      <option value="">선택</option><option value="MALE">남</option><option value="FEMALE">여</option>
                    </select>
                  </td>
                  <th className={thClass}>연락처{requiredLabel}</th>
                  <td className={tdClass}><input name="phone" value={form.phone} onChange={handlePhoneChange} className={`${inputClass} w-full bg-white`} placeholder="010-1234-5678" required /></td>
                </tr>
                <tr>
                  <th className={thClass}>현재 상태</th>
                  <td className={tdClass}><input value={form.status} readOnly className={`${inputClass} w-full bg-gray-100 text-center`} /></td>
                  <th className={thClass}>인형 아이디{requiredLabel}</th>
                  <td className={tdClass}><input name="doll_id" value={form.doll_id} onChange={handleChange} className={`${inputClass} w-full bg-white`} required /></td>
                </tr>
                <tr>
                  <th className={thClass}>주소{requiredLabel}</th>
                  <td className={tdClass} colSpan={3}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input name="zip_code" value={form.zip_code} readOnly placeholder="우편번호" className={`${inputClass} w-30 bg-gray-100`} />
                        <button type="button" onClick={handleZipSearch} disabled={!isScriptLoaded} className="bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-600 whitespace-nowrap disabled:bg-gray-400 disabled:cursor-wait">
                          {isScriptLoaded ? "우편번호 검색" : "서비스 로딩 중"}
                        </button>
                        <input name="address" value={form.address} readOnly placeholder="주소" className={`${inputClass} bg-gray-100 flex-grow`} />
                      </div>
                      <input name="address_detail" ref={addressDetailRef} value={form.address_detail} onChange={handleChange} placeholder="상세주소" className={`${inputClass} w-full`} />
                    </div>
                  </td>
                </tr>
                <tr>
                  <th className={thClass}>거주 형태</th>
                  <td className={tdClass} colSpan={3}>
                    <div className="flex items-center gap-4 flex-wrap py-1">
                      {Object.values(Residence).map((res) => (
                        <label key={res} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" name="residence" value={res} checked={form.residence === res} onChange={handleChange} className="w-4 h-4" /> {res}
                        </label>
                      ))}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
          
          <section>
            <h2 className={sectionTitleClass}>■ 건강상태</h2>
            <table className={tableClass}>
              <colgroup><col className="w-34" /><col className="w-73" /><col className="w-35" /><col className="w-auto" /></colgroup>
              <tbody>
                <tr>
                  <th className={thClass}>질병</th>
                  <td className={tdClass}><input name="diseases" value={form.diseases} onChange={handleChange} className={`${inputClass} w-full bg-white`} /></td>
                  <th className={thClass}>복용 약물</th>
                  <td className={tdClass}><input name="medications" value={form.medications} onChange={handleChange} className={`${inputClass} w-full bg-white`} /></td>
                </tr>
                <tr>
                  <th className={thClass}>상세 증상</th>
                  <td className={tdClass} colSpan={3}><textarea name="disease_note" value={form.disease_note} onChange={handleChange} rows={3} className={`${inputClass} w-full bg-white`} /></td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className={sectionTitleClass}>■ 보호자</h2>
            <table className={tableClass}>
              <colgroup><col className="w-34" /><col className="w-73" /><col className="w-35" /><col className="w-auto" /></colgroup>
              <tbody>
                <tr>
                  <th className={thClass}>이름{requiredLabel}</th>
                  <td className={tdClass}><input name="guardian_name" value={form.guardian_name} onChange={handleChange} className={`${inputClass} w-full bg-white`} required /></td>
                  <th className={thClass}>연락처{requiredLabel}</th>
                  <td className={tdClass}><input name="guardian_phone" value={form.guardian_phone} onChange={handlePhoneChange} className={`${inputClass} w-full bg-white`} placeholder="010-1234-5678" required /></td>
                </tr>
                <tr>
                  <th className={thClass}>이용자와의 관계{requiredLabel}</th>
                  <td className={tdClass}>
                    <select name="relationship" value={form.relationship} onChange={handleChange} className={`${inputClass} w-full bg-white`} required>
                      <option value="">선택</option>
                      {relationshipOptions.map((option) => (<option key={option} value={option}>{option}</option>))}
                    </select>
                  </td>
                  <th className={thClass}>참고사항</th>
                  <td className={tdClass}><input name="guardian_note" value={form.guardian_note} onChange={handleChange} className={`${inputClass} w-full bg-white`} /></td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className={sectionTitleClass}>■ 이외 참고사항</h2>
            <table className={tableClass}>
              <colgroup><col className="w-34" /><col className="w-auto" /></colgroup>
              <tbody>
                <tr>
                  <th className={thClass}>참고사항</th>
                  <td className={tdClass}><textarea name="note" value={form.note} onChange={handleChange} rows={3} className={`${inputClass} w-full bg-white`} /></td>
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