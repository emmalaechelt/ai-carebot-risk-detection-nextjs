"use client";

import { useState, useEffect, useRef, ChangeEvent, FormEvent, FocusEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import api from "@/lib/api";
import { Residence, SeniorSex } from "@/types";
import axios from "axios";

// --- 타입 정의 ---
interface DaumPostcodeData {
  zonecode: string;
  roadAddress: string;
  sigungu: string;
  bname: string;
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (config: { oncomplete: (data: DaumPostcodeData) => void }) => { open: () => void };
    };
  }
}

// 날짜 유효성 검사
const isValidDate = (y: number, m: number, d: number): boolean => {
  const date = new Date(y, m - 1, d);
  const today = new Date();
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d && date <= today;
};

// 나이 계산
const calculateAge = (birthDate: string): number | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

// 선택 옵션
const relationshipOptions = ["자녀", "배우자", "부모", "형제자매", "친척", "기타"];
const residenceOptions: { key: string; value: string }[] = [
  { key: "SINGLE_FAMILY_HOME", value: "단독주택" },
  { key: "MULTIPLEX_HOUSING", value: "다세대주택" },
  { key: "MULTI_FAMILY_HOUSING", value: "다가구주택" },
  { key: "APARTMENT", value: "아파트" },
];

// --- 메인 컴포넌트 ---
export default function UserEditPage() {
  const router = useRouter();
  const params = useParams();
  const seniorId = params?.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const [form, setForm] = useState({
    doll_id: "",
    name: "",
    birth_date: "",
    sex: "" as SeniorSex | "",
    phone: "",
    zip_code: "",
    address: "",
    address_detail: "",
    gu: "",
    dong: "",
    residence: "" as Residence | "",
    status: "정상",
    diseases: "",
    medications: "",
    disease_note: "",
    guardian_name: "",
    relationship: "",
    guardian_phone: "",
    guardian_note: "",
    note: "",
    latitude: 0,
    longitude: 0,
  });

  const [birth, setBirth] = useState({ year: "", month: "", day: "" });
  const [age, setAge] = useState<number | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const addressDetailRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // --- Daum Postcode ---
  useEffect(() => {
    const scriptUrl = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    if (document.querySelector(`script[src="${scriptUrl}"]`)) {
      setIsScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    document.head.appendChild(script);
  }, []);

  // --- 기존 이용자 정보 불러오기 ---
  useEffect(() => {
    if (!seniorId) return;
    const fetchSenior = async () => {
      try {
        const res = await api.get(`/seniors/${seniorId}`);
        const data = res.data;
        console.log("불러온 데이터:", data);

        setForm({
          doll_id: data.doll_id || "",
          name: data.name || "",
          birth_date: data.birth_date || "",
          sex: data.sex || "",
          phone: data.phone || "",
          zip_code: "",
          address: data.address || "",
          address_detail: data.address_detail || "",
          gu: data.gu || "",
          dong: data.dong || "",
          residence: data.residence || "",
          status: data.state || "정상",
          diseases: data.diseases || "",
          medications: data.medications || "",
          disease_note: data.disease_note || "",
          guardian_name: data.guardian_name || "",
          relationship: data.relationship || "",
          guardian_phone: data.guardian_phone || "",
          guardian_note: data.guardian_note || "",
          note: data.note || "",
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
        });

        if (data.birth_date) {
          const [y, m, d] = data.birth_date.split("-");
          setBirth({ year: y, month: m, day: d });
          setAge(calculateAge(data.birth_date));
        }
        if (data.photo_url) setPhotoPreview("http://localhost:8080" + data.photo_url);
      } catch {
        alert("이용자 정보를 불러오지 못했습니다.");
        router.push("/users/view");
      }
    };
    fetchSenior();
  }, [seniorId, router]);

  // 생년월일 입력 처리
  useEffect(() => {
    const { year, month, day } = birth;
    if (year.length === 4 && month && day) {
      const y = parseInt(year, 10),
        m = parseInt(month, 10),
        d = parseInt(day, 10);
      if (isValidDate(y, m, d)) {
        const full = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        setForm((prev) => ({ ...prev, birth_date: full }));
        setAge(calculateAge(full));
      } else {
        setForm((prev) => ({ ...prev, birth_date: "" }));
        setAge(null);
      }
    }
  }, [birth]);

  // --- 입력 핸들러 ---
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleBirthChange = (e: ChangeEvent<HTMLInputElement>) =>
    setBirth((prev) => ({ ...prev, [e.target.name]: e.target.value.replace(/\D/g, "") }));

  const handleBirthBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!value) return;
    const n = parseInt(value, 10);
    let nv = value;
    if (name === "month") nv = String(Math.max(1, Math.min(12, n))).padStart(2, "0");
    if (name === "day") nv = String(Math.max(1, Math.min(31, n))).padStart(2, "0");
    if (nv !== value) setBirth((p) => ({ ...p, [name]: nv }));
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const f = value.replace(/\D/g, "").replace(/(\d{3})(\d{1,4})?(\d{1,4})?/, "$1-$2-$3").slice(0, 13);
    setForm((p) => ({ ...p, [name]: f }));
  };

  // --- 주소 검색 ---
  const handleZipSearch = () => {
    if (!isScriptLoaded || !window.daum?.Postcode) {
      alert("주소 검색 스크립트가 아직 로드되지 않았습니다.");
      return;
    }
    const postcode = new window.daum.Postcode({
      oncomplete: (data: DaumPostcodeData) => {
        setForm((prev) => ({
          ...prev,
          zip_code: data.zonecode || "",
          address: data.roadAddress || "",
          gu: data.sigungu || "",
          dong: data.bname || "",
        }));
        addressDetailRef.current?.focus();
      },
    });
    postcode.open();
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // --- 저장 (AbortError 방지 포함) ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !seniorId) return;

    setIsSubmitting(true);
    try {
      const seniorPayload = {
        doll_id: form.doll_id,
        name: form.name,
        birth_date: form.birth_date,
        sex: form.sex,
        residence: form.residence,
        phone: form.phone,
        address: form.address,
        address_detail: form.address_detail.trim(),
        gu: form.gu,
        dong: form.dong,
        note: form.note,
        guardian_name: form.guardian_name,
        guardian_phone: form.guardian_phone,
        relationship: form.relationship,
        guardian_note: form.guardian_note,
        diseases: form.diseases,
        medications: form.medications,
        disease_note: form.disease_note,
        latitude: form.latitude,
        longitude: form.longitude,
      };

      const formData = new FormData();
      formData.append("senior", new Blob([JSON.stringify(seniorPayload)], { type: "application/json" }));
      if (photo) formData.append("photo", photo);

      await api.put(`/seniors/${seniorId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("이용자 정보가 수정되었습니다.");

      // ✅ AbortError 방지용 지연 후 페이지 이동
      setTimeout(() => {
        router.push(`/users/view/${seniorId}`);
      }, 150);
    } catch (err: unknown) {
      console.error("수정 요청 중 오류:", err);
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const msg = err.response?.data?.error;
        if (status === 400) alert(`요청 형식이 올바르지 않습니다.\n${msg || ""}`);
        else if (status === 401) alert("인증이 만료되었습니다. 다시 로그인 해주세요.");
        else if (status === 403) alert("수정 권한이 없습니다.");
        else if (status === 404) alert("이용자 정보를 찾을 수 없습니다.");
        else if (status === 409) alert("중복된 데이터가 존재합니다.");
        else alert(msg || "서버 오류가 발생했습니다.");
      } else alert("알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- UI 클래스 ---
   const sectionTitleClass = "text-lg font-semibold text-gray-800";
  const tableBorderClass = "border-gray-200";
  const tableClass = `w-full border-collapse text-sm border ${tableBorderClass}`;
  const thClass = `border ${tableBorderClass} bg-gray-50 font-medium p-2 text-center align-middle whitespace-nowrap`;
  const tdClass = `border ${tableBorderClass} p-2 align-middle`;
  const inputClass = "border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm";
  const requiredLabel = <span className="text-red-500 ml-1">*</span>;

  return (
    <div className="p-5 bg-white rounded-lg shadow-md max-w-5xl mx-auto text-black">
      <h1 className="text-2xl font-bold mb-4 text-center">이용자 정보 수정</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <section>
           <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-5 bg-blue-600 rounded"></div>
              <h2 className={sectionTitleClass}>기본정보</h2></div>
          <table className={tableClass}>
            <colgroup>
              <col className="w-34" /><col className="w-28" /><col className="w-45" /><col className="w-35" /><col className="w-auto" />
            </colgroup>
            <tbody>
              <tr>
                <td className={tdClass} rowSpan={5}>
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <div className="relative w-28 h-36 border border-dashed rounded-md flex items-center justify-center bg-gray-50 overflow-hidden">
                      {photoPreview ? <Image src={photoPreview} alt="사진 미리보기" layout="fill" objectFit="cover" /> : <span className="text-gray-400 text-sm">사진</span>}
                    </div>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} ref={photoInputRef} className="hidden" />
                    <button type="button" onClick={() => photoInputRef.current?.click()} className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">사진 변경</button>
                  </div>
                </td>
                <th className={thClass}>이름{requiredLabel}</th>
                <td className={tdClass}>
                  <input name="name" value={form.name} onChange={handleChange} className={`${inputClass} w-full`} required />
                </td>
                <th className={thClass}>생년월일 (나이){requiredLabel}</th>
                <td className={tdClass}>
                  <div className="flex items-center gap-1">
                    <input name="year" value={birth.year} onChange={handleBirthChange} onBlur={handleBirthBlur} className={`${inputClass} w-20 text-center`} placeholder="YYYY" maxLength={4} required /> <span className="mr-2">년</span>
                    <input name="month" value={birth.month} onChange={handleBirthChange} onBlur={handleBirthBlur} className={`${inputClass} w-14 text-center`} placeholder="MM" maxLength={2} required /> <span className="mr-2">월</span>
                    <input name="day" value={birth.day} onChange={handleBirthChange} onBlur={handleBirthBlur} className={`${inputClass} w-14 text-center`} placeholder="DD" maxLength={2} required /> <span className="mr-2">일</span>
                    <span>(만</span><input readOnly value={age ?? ""} className={`${inputClass} w-15 text-center mx-1 bg-gray-100`} /><span>세)</span>
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
                <td className={tdClass}>
                  <input name="phone" value={form.phone} onChange={handlePhoneChange} className={`${inputClass} w-full bg-white`} placeholder="010-1234-5678" required />
                </td>
              </tr>
              <tr>
                <th className={thClass}>현재 상태</th>
                <td className={tdClass}>
                  <input value={form.status} readOnly className={`${inputClass} w-full bg-gray-100 text-center`} />
                </td>
                <th className={thClass}>인형 아이디{requiredLabel}</th>
                <td className={tdClass}>
                  <input name="doll_id" value={form.doll_id} onChange={handleChange} className={`${inputClass} w-full bg-white`} required />
                </td>
              </tr>
              <tr>
                <th className={thClass}>주소{requiredLabel}</th>
                <td className={tdClass} colSpan={3}>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input name="zip_code" value={form.zip_code} readOnly placeholder="우편번호" className={`${inputClass} w-30 bg-gray-100`} />
                      <button type="button" onClick={handleZipSearch} disabled={!isScriptLoaded} className="bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-600 whitespace-nowrap disabled:bg-gray-400 cursor-pointer">
                        우편번호 검색
                      </button>
                      <input name="address" value={form.address} readOnly placeholder="주소" className={`${inputClass} bg-gray-100 flex-grow`} />
                    </div>
                    <input name="address_detail" ref={addressDetailRef} value={form.address_detail} onChange={handleChange} placeholder="상세주소" className={`${inputClass} w-full`} />
                  </div>
                </td>
              </tr>
              <tr>
                <th className={thClass}>거주 형태{requiredLabel}</th>
                <td className={tdClass} colSpan={3}>
                  <div className="flex items-center gap-4 flex-wrap py-1">
                    {residenceOptions.map((res, index) => (
                      <label key={res.key} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="residence" value={res.key} checked={form.residence === res.key} onChange={handleChange} className="w-4 h-4" required={index === 0} />
                        {res.value}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
           <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-5 bg-blue-600 rounded"></div>
              <h2 className={sectionTitleClass}>건강상태</h2></div>
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
          <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-5 bg-blue-600 rounded "></div>
              <h2 className={sectionTitleClass}>보호자</h2></div>
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
          <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-5 bg-blue-600 rounded "></div>
              <h2 className={sectionTitleClass}>이외 참고사항</h2></div>
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

        <div className="flex justify-center pt-2 gap-4">
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 cursor-pointer">
            저장
          </button>
          <button type="button" onClick={() => router.push(`/users/view/${seniorId}`)} className="px-4 py-2 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 cursor-pointer">
            취소
          </button>
        </div>
      </form>
    </div>
  );
}