"use client";

import { useState, useEffect, useRef, ChangeEvent, FormEvent, FocusEvent, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import api from "@/lib/api";
import { Residence, SeniorSex } from "@/types";
import axios from "axios";

// 타입 및 인터페이스 정의
interface DaumPostcodeData {
  zonecode: string;
  roadAddress: string;
  sigungu: string;
  bname: string;
}
interface PostcodeOptions {
  oncomplete: (data: DaumPostcodeData) => void;
}
interface PostcodeInstance {
  open(): void;
}
interface PostcodeConstructor {
  new (options: PostcodeOptions): PostcodeInstance;
}
declare global {
  interface Window {
    daum?: {
      Postcode: PostcodeConstructor;
    };
  }
}
interface RecentOverallResult {
  id: number;
  label: string;
  summary: string;
  timestamp: string;
}

// 유틸리티 함수
const isValidDate = (y: number, m: number, d: number): boolean => {
  const date = new Date(y, m - 1, d);
  const today = new Date();
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d && date <= today;
};
const calculateAge = (birthDate: string): number | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

// 상수 정의
const relationshipOptions = ["자녀", "배우자", "부모", "형제자매", "친척", "기타"];
const residenceOptions: { key: string; value: string }[] = [
    { key: "SINGLE_FAMILY_HOME", value: "단독주택" },
    { key: "MULTIPLEX_HOUSING", value: "다세대주택" },
    { key: "MULTI_FAMILY_HOUSING", value: "다가구주택" },
    { key: "APARTMENT", value: "아파트" },
];
const statusMap: Record<string, string> = {
  "EMERGENCY": "긴급",
  "CRITICAL": "위험",
  "DANGER": "주의",
  "POSITIVE": "안전"
};

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // 상태 관리
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    doll_id: "", name: "", birth_date: "", sex: "" as SeniorSex | "",
    phone: "", zip_code: "", address: "", address_detail: "",
    gu: "", dong: "",
    residence: "" as Residence | "",
    state: "", diseases: "",
    medications: "", disease_note: "", guardian_name: "", relationship: "",
    guardian_phone: "", guardian_note: "", note: "",
  });

  const [birth, setBirth] = useState({ year: "", month: "", day: "" });
  const [age, setAge] = useState<number | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [recentResults, setRecentResults] = useState<RecentOverallResult[]>([]);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  
  const addressDetailRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // 데이터 로딩 함수
  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/seniors/${id}`);
      setForm({
        doll_id: data.doll_id || "",
        name: data.name || "",
        birth_date: data.birth_date || "",
        sex: data.sex || "",
        phone: data.phone || "",
        address: data.address || "",
        address_detail: "", // 상세주소는 전체 주소에 포함되어 있어 분리하지 않음
        zip_code: "", // API에서 우편번호를 제공하지 않음
        gu: data.gu || "",
        dong: data.dong || "",
        residence: data.residence || "",
        state: data.state || "",
        diseases: data.diseases || "",
        medications: data.medications || "",
        disease_note: data.disease_note || "",
        guardian_name: data.guardian_name || "",
        guardian_phone: data.guardian_phone || "",
        relationship: data.relationship || "",
        guardian_note: data.guardian_note || "",
        note: data.note || "",
      });

      if (data.birth_date) {
        const [year, month, day] = data.birth_date.split('-');
        setBirth({ year, month, day });
      }
      setPhotoPreview(data.photo_url ? `http://127.0.0.1:8080${data.photo_url}` : null);
      setRecentResults(data.recent_overall_results || []);
    } catch (err) {
      console.error("Failed to fetch senior:", err);
      setError("이용자 정보를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Daum Postcode 스크립트 로딩
  useEffect(() => {
    const scriptUrl = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    const existingScript = document.querySelector(`script[src="${scriptUrl}"]`);
    if (existingScript) {
      setTimeout(() => { if (window.daum?.Postcode) setIsScriptLoaded(true); }, 100);
      return;
    }
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    document.head.appendChild(script);
    return () => { document.head.querySelector(`script[src="${scriptUrl}"]`)?.remove(); };
  }, []);

  // 생년월일 -> 나이 계산
  useEffect(() => {
    const { year, month, day } = birth;
    if (year.length === 4 && month.length > 0 && day.length > 0) {
      const yearNum = parseInt(year, 10), monthNum = parseInt(month, 10), dayNum = parseInt(day, 10);
      if (isValidDate(yearNum, monthNum, dayNum)) {
        const fullDate = `${year}-${String(monthNum).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
        setForm(prev => ({ ...prev, birth_date: fullDate }));
        setAge(calculateAge(fullDate));
      } else {
        setForm(prev => ({ ...prev, birth_date: "" })); setAge(null);
      }
    } else {
      setForm(prev => ({ ...prev, birth_date: "" })); setAge(null);
    }
  }, [birth]);


  // 입력 핸들러
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleBirthChange = (e: ChangeEvent<HTMLInputElement>) => setBirth(prev => ({ ...prev, [e.target.name]: e.target.value.replace(/\D/g, "") }));
  const handleBirthBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!value) return;
    let numValue = parseInt(value, 10), newValue = value;
    if (name === "month") {
      if (numValue < 1) newValue = "01"; else if (numValue > 12) newValue = "12";
      else newValue = String(numValue).padStart(2, '0');
    } else if (name === "day") {
      if (numValue < 1) newValue = "01"; else if (numValue > 31) newValue = "31";
      else newValue = String(numValue).padStart(2, '0');
    }
    if (newValue !== value) setBirth(prev => ({ ...prev, [name]: newValue }));
  };
  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const formatted = value.replace(/\D/g, "").replace(/(\d{3})(\d{1,4})?(\d{1,4})?/, (_, p1, p2, p3) => {
      let result = p1; if (p2) result += `-${p2}`; if (p3) result += `-${p3}`; return result;
    }).slice(0, 13);
    setForm(prev => ({ ...prev, [name]: formatted }));
  };
  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };
  const handleZipSearch = () => {
    if (isScriptLoaded && window.daum?.Postcode) {
      new window.daum.Postcode({
        oncomplete: (data: DaumPostcodeData) => {
          setForm(prev => ({
            ...prev,
            zip_code: data.zonecode,
            address: data.roadAddress,
            gu: data.sigungu,
            dong: data.bname,
          }));
          addressDetailRef.current?.focus();
        },
      }).open();
    }
  };

  // 액션 핸들러
  const handleCancel = () => {
    if (confirm("변경사항이 저장되지 않습니다. 수정을 취소하시겠습니까?")) {
      setIsEditMode(false);
      setPhoto(null);
      fetchData(); // 원본 데이터로 복구
    }
  };

  const handleDelete = async () => {
    if (confirm(`'${form.name}' 님의 정보를 정말로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      try {
        await api.delete(`/seniors/${id}`);
        alert("이용자 정보가 성공적으로 삭제되었습니다.");
        router.push("/main/users/view");
      } catch (err) {
        alert("정보 삭제에 실패했습니다.");
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const requiredFields = [
        form.doll_id, form.name, form.birth_date, form.sex, form.phone, 
        form.address, form.gu, form.dong,
        form.residence, form.guardian_name, form.guardian_phone, form.relationship
    ];
    if (requiredFields.some(field => !field)) {
      alert("필수 항목(*)을 모두 입력해주세요. (주소는 반드시 '우편번호 검색'을 이용해야 합니다)");
      return;
    }
    
    setIsSubmitting(true);
    const seniorPayload = {
      doll_id: form.doll_id, name: form.name, birth_date: form.birth_date,
      sex: form.sex, residence: form.residence, phone: form.phone,
      address: `${form.address} ${form.address_detail}`.trim(),
      gu: form.gu, dong: form.dong, note: form.note,
      guardian_name: form.guardian_name, guardian_phone: form.guardian_phone,
      relationship: form.relationship, guardian_note: form.guardian_note,
      diseases: form.diseases, medications: form.medications, disease_note: form.disease_note,
    };

    try {
      const formData = new FormData();
      formData.append("senior", new Blob([JSON.stringify(seniorPayload)], { type: "application/json" }));
      if (photo) formData.append("photo", photo);

      await api.put(`/seniors/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });

      alert("정보가 성공적으로 수정되었습니다.");
      setIsEditMode(false);
      setPhoto(null);
      fetchData(); // 최신 정보 다시 로드
    } catch (error) {
      const msg = axios.isAxiosError(error) ? (error.response?.data?.message || "서버 오류") : "알 수 없는 오류";
      alert(`수정 실패: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 렌더링
  if (loading) return <div className="text-center py-20">로딩 중...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

  const sectionTitleClass = "text-lg font-semibold text-gray-800 mb-1.5";
  const tableBorderClass = "border-gray-400";
  const tableClass = `w-full border-collapse text-sm border ${tableBorderClass}`;
  const thClass = `border ${tableBorderClass} bg-gray-50 font-medium p-2 text-center align-middle whitespace-nowrap`;
  const tdClass = `border ${tableBorderClass} p-2 align-middle`;
  const inputClass = `border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm disabled:bg-gray-100 disabled:text-gray-500`;
  const requiredLabel = <span className="text-red-500 ml-1">*</span>;

  return (
    <div className="p-5 bg-white rounded-lg shadow-md max-w-5xl mx-auto text-black">
      <h1 className="text-2xl font-bold mb-4 text-center">
        {isEditMode ? "이용자 정보 수정" : "이용자 상세 정보"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본정보 섹션 */}
        <section>
          <h2 className={sectionTitleClass}>■ 기본정보</h2>
          <table className={tableClass}>
            <colgroup><col className="w-34" /><col className="w-28" /><col className="w-45" /><col className="w-35" /><col className="w-auto" /></colgroup>
            <tbody>
              <tr>
                <td className={tdClass} rowSpan={5}>
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <div className="relative w-28 h-36 border border-dashed rounded-md flex items-center justify-center bg-gray-50 overflow-hidden">
                      {photoPreview ? ( <Image src={photoPreview} alt="사진 미리보기" layout="fill" objectFit="cover" unoptimized /> ) : ( <span className="text-gray-400 text-sm">사진</span> )}
                    </div>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} ref={photoInputRef} className="hidden" disabled={!isEditMode} />
                    <button type="button" onClick={() => photoInputRef.current?.click()} className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 disabled:bg-gray-200 disabled:cursor-not-allowed" disabled={!isEditMode}>사진 첨부</button>
                  </div>
                </td>
                <th className={thClass}>이름{isEditMode && requiredLabel}</th>
                <td className={tdClass}><input name="name" value={form.name} onChange={handleChange} className={`${inputClass} w-full`} required disabled={!isEditMode} /></td>
                <th className={thClass}>생년월일 (나이){isEditMode && requiredLabel}</th>
                <td className={tdClass}>
                  <div className="flex items-center gap-1">
                    <input name="year" value={birth.year} onChange={handleBirthChange} onBlur={handleBirthBlur} className={`${inputClass} w-20 text-center`} placeholder="YYYY" maxLength={4} required disabled={!isEditMode} /> <span className="mr-2">년</span>
                    <input name="month" value={birth.month} onChange={handleBirthChange} onBlur={handleBirthBlur} className={`${inputClass} w-14 text-center`} placeholder="MM" maxLength={2} required disabled={!isEditMode} /> <span className="mr-2">월</span>
                    <input name="day" value={birth.day} onChange={handleBirthChange} onBlur={handleBirthBlur} className={`${inputClass} w-14 text-center`} placeholder="DD" maxLength={2} required disabled={!isEditMode} /> <span className="mr-2">일</span>
                    <span>(만</span><input readOnly value={age ?? ""} className={`${inputClass} w-15 text-center mx-1`} /><span>세)</span>
                  </div>
                </td>
              </tr>
              <tr>
                <th className={thClass}>성별{isEditMode && requiredLabel}</th>
                <td className={tdClass}>
                  <select name="sex" value={form.sex} onChange={handleChange} className={`${inputClass} w-full bg-white`} required disabled={!isEditMode}>
                    <option value="">선택</option><option value="MALE">남</option><option value="FEMALE">여</option>
                  </select>
                </td>
                <th className={thClass}>연락처{isEditMode && requiredLabel}</th>
                <td className={tdClass}><input name="phone" value={form.phone} onChange={handlePhoneChange} className={`${inputClass} w-full`} placeholder="010-1234-5678" required disabled={!isEditMode} /></td>
              </tr>
              <tr>
                <th className={thClass}>현재 상태</th>
                <td className={tdClass}><input value={statusMap[form.state] || form.state} readOnly className={`${inputClass} w-full text-center`} /></td>
                <th className={thClass}>인형 아이디{isEditMode && requiredLabel}</th>
                <td className={tdClass}><input name="doll_id" value={form.doll_id} onChange={handleChange} className={`${inputClass} w-full`} required disabled={!isEditMode} /></td>
              </tr>
              <tr>
                <th className={thClass}>주소{isEditMode && requiredLabel}</th>
                <td className={tdClass} colSpan={3}>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                       <input name="zip_code" value={form.zip_code} readOnly placeholder="우편번호" className={`${inputClass} w-30`} />
                       <button type="button" onClick={handleZipSearch} disabled={!isScriptLoaded || !isEditMode} className="bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-600 whitespace-nowrap disabled:bg-gray-400 disabled:cursor-not-allowed">
                         {isScriptLoaded ? "우편번호 검색" : "로딩 중"}</button>
                       <input name="address" value={form.address} readOnly placeholder="주소" className={`${inputClass} flex-grow`} />
                    </div>
                    <input name="address_detail" ref={addressDetailRef} value={form.address_detail} onChange={handleChange} placeholder="상세주소" className={`${inputClass} w-full`} disabled={!isEditMode} />
                  </div>
                </td>
              </tr>
              <tr>
                <th className={thClass}>거주 형태{isEditMode && requiredLabel}</th>
                <td className={tdClass} colSpan={3}>
                  <div className="flex items-center gap-4 flex-wrap py-1">
                    {residenceOptions.map((res) => (
                      <label key={res.key} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="residence" value={res.key} checked={form.residence === res.key} onChange={handleChange} className="w-4 h-4" disabled={!isEditMode} /> {res.value}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 건강상태, 보호자, 참고사항 섹션 */}
        <section><h2 className={sectionTitleClass}>■ 건강상태</h2><table className={tableClass}><tbody>
            <tr><th className={thClass}>질병</th><td className={tdClass}><input name="diseases" value={form.diseases} onChange={handleChange} className={`${inputClass} w-full`} disabled={!isEditMode}/></td><th className={thClass}>복용 약물</th><td className={tdClass}><input name="medications" value={form.medications} onChange={handleChange} className={`${inputClass} w-full`} disabled={!isEditMode}/></td></tr>
            <tr><th className={thClass}>상세 증상</th><td className={tdClass} colSpan={3}><textarea name="disease_note" value={form.disease_note} onChange={handleChange} rows={3} className={`${inputClass} w-full`} disabled={!isEditMode}/></td></tr>
        </tbody></table></section>
        <section><h2 className={sectionTitleClass}>■ 보호자</h2><table className={tableClass}><tbody>
            <tr><th className={thClass}>이름{isEditMode && requiredLabel}</th><td className={tdClass}><input name="guardian_name" value={form.guardian_name} onChange={handleChange} className={`${inputClass} w-full`} required disabled={!isEditMode}/></td><th className={thClass}>연락처{isEditMode && requiredLabel}</th><td className={tdClass}><input name="guardian_phone" value={form.guardian_phone} onChange={handlePhoneChange} className={`${inputClass} w-full`} required disabled={!isEditMode}/></td></tr>
            <tr><th className={thClass}>이용자와의 관계{isEditMode && requiredLabel}</th><td className={tdClass}><select name="relationship" value={form.relationship} onChange={handleChange} className={`${inputClass} w-full bg-white`} required disabled={!isEditMode}><option value="">선택</option>{relationshipOptions.map(o => (<option key={o} value={o}>{o}</option>))}</select></td><th className={thClass}>참고사항</th><td className={tdClass}><input name="guardian_note" value={form.guardian_note} onChange={handleChange} className={`${inputClass} w-full`} disabled={!isEditMode}/></td></tr>
        </tbody></table></section>
        <section><h2 className={sectionTitleClass}>■ 이외 참고사항</h2><table className={tableClass}><tbody>
            <tr><th className={thClass}>참고사항</th><td className={tdClass}><textarea name="note" value={form.note} onChange={handleChange} rows={3} className={`${inputClass} w-full`} disabled={!isEditMode}/></td></tr>
        </tbody></table></section>

        {/* 최근 분석 목록 (조회 모드에서만 표시) */}
        {!isEditMode && (
          <section>
            <h2 className={sectionTitleClass}>■ 최근 분석 목록 (최대 5개)</h2>
            <div className="overflow-x-auto"><table className={`${tableClass} text-center`}>
              <thead className="bg-gray-50"><tr><th className={`${thClass} w-48`}>분석일시</th><th className={`${thClass} w-24`}>분석 결과</th><th className={`${thClass}`}>결과 요약</th></tr></thead>
              <tbody>{recentResults.length > 0 ? recentResults.map(r => (<tr key={r.id}><td className={tdClass}>{new Date(r.timestamp).toLocaleString('ko-KR')}</td><td className={tdClass}>{statusMap[r.label] || r.label}</td><td className={`${tdClass} text-left`}>{r.summary}</td></tr>)) : (<tr><td className={tdClass} colSpan={3}>최근 분석 결과가 없습니다.</td></tr>)}</tbody>
            </table></div>
          </section>
        )}
        
        {/* 하단 액션 버튼 */}
        <div className="flex justify-center items-center gap-4 pt-4">
            {isEditMode ? (
            <>
              <button type="submit" disabled={isSubmitting} className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                {isSubmitting ? "저장 중..." : "저장"}
              </button>
              <button type="button" onClick={handleCancel} className="px-8 py-2 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600">
                취소
              </button>
            </>
            ) : (
            <>
              <button type="button" onClick={() => router.push('/main/users/view')} className="px-6 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600">
                목록
              </button>
              <button type="button" onClick={() => setIsEditMode(true)} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                수정
              </button>
              <button type="button" onClick={handleDelete} className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">
                삭제
              </button>
            </>
            )}
        </div>
      </form>
    </div>
  );
}