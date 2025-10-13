"use client";

import { useState, useEffect, useRef, ChangeEvent, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import api from "@/lib/api";
import { Residence, SeniorSex } from "@/types";

interface DaumPostcodeData { zonecode: string; roadAddress: string; sigungu: string; bname: string; }
declare global { interface Window { daum?: { Postcode: any; }; } }

interface Analysis { id: number; title: string; date: string; result: string; }

const relationshipOptions = ["자녀", "배우자", "부모", "형제자매", "친척", "기타"];
const residenceOptions: { key: string; value: string }[] = [
  { key: "SINGLE_FAMILY_HOME", value: "단독주택" },
  { key: "MULTIPLEX_HOUSING", value: "다세대주택" },
  { key: "MULTI_FAMILY_HOUSING", value: "다가구주택" },
  { key: "APARTMENT", value: "아파트" },
];

const isValidDate = (y: number, m: number, d: number) => {
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

export default function UserEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [form, setForm] = useState({
    doll_id: "", name: "", birth_date: "", sex: "" as SeniorSex | "",
    phone: "", zip_code: "", address: "", address_detail: "",
    gu: "", dong: "", residence: "" as Residence | "",
    status: "정상", diseases: "", medications: "", disease_note: "",
    guardian_name: "", relationship: "", guardian_phone: "", guardian_note: "", note: "",
  });

  const [birth, setBirth] = useState({ year: "", month: "", day: "" });
  const [age, setAge] = useState<number | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const addressDetailRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Daum Postcode 스크립트
  useEffect(() => {
    const scriptUrl = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    if (!document.querySelector(`script[src="${scriptUrl}"]`)) {
      const script = document.createElement("script");
      script.src = scriptUrl;
      script.async = true;
      script.onload = () => setIsScriptLoaded(true);
      document.head.appendChild(script);
    } else setIsScriptLoaded(true);
  }, []);

  // 데이터 로딩
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const { data } = await api.get(`/seniors/${id}`);
        setForm({
          doll_id: data.doll_id ?? "",
          name: data.name ?? "",
          birth_date: data.birth_date ?? "",
          sex: data.sex ?? "",
          phone: data.phone ?? "",
          zip_code: data.zip_code ?? "",
          address: data.address ?? "",
          address_detail: data.address_detail ?? "",
          gu: data.gu ?? "",
          dong: data.dong ?? "",
          residence: data.residence ?? "",
          status: data.status ?? "정상",
          diseases: data.diseases ?? "",
          medications: data.medications ?? "",
          disease_note: data.disease_note ?? "",
          guardian_name: data.guardian_name ?? "",
          relationship: data.relationship ?? "",
          guardian_phone: data.guardian_phone ?? "",
          guardian_note: data.guardian_note ?? "",
          note: data.note ?? "",
        });

        setBirth({
          year: data.birth_date?.slice(0, 4) ?? "",
          month: data.birth_date?.slice(5, 7) ?? "",
          day: data.birth_date?.slice(8, 10) ?? "",
        });

        setAge(calculateAge(data.birth_date ?? ""));
        setPhotoPreview(data.photo_url ?? null);

        const res = await api.get(`/seniors/${id}/analyses`);
        setAnalyses(res.data ?? []);
      } catch {
        alert("데이터 로딩 실패");
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const { year, month, day } = birth;
    if (year.length === 4 && month.length > 0 && day.length > 0) {
      const y = parseInt(year), m = parseInt(month), d = parseInt(day);
      if (isValidDate(y, m, d)) {
        const fullDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        setForm(prev => ({ ...prev, birth_date: fullDate }));
        setAge(calculateAge(fullDate));
      } else { setForm(prev => ({ ...prev, birth_date: "" })); setAge(null); }
    } else { setForm(prev => ({ ...prev, birth_date: "" })); setAge(null); }
  }, [birth]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleBirthChange = (e: ChangeEvent<HTMLInputElement>) =>
    setBirth(prev => ({ ...prev, [e.target.name]: e.target.value.replace(/\D/g, "") }));

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const formatted = value.replace(/\D/g, "").replace(/(\d{3})(\d{1,4})?(\d{1,4})?/, "$1-$2-$3").slice(0, 13);
    setForm(prev => ({ ...prev, [name]: formatted }));
  };

  const handleZipSearch = () => {
    if (isScriptLoaded && window.daum?.Postcode) {
      new window.daum.Postcode({
        oncomplete: (data: DaumPostcodeData) => {
          setForm(prev => ({
            ...prev,
            zip_code: data.zonecode ?? "",
            address: data.roadAddress ?? "",
            gu: data.sigungu ?? "",
            dong: data.bname ?? ""
          }));
          addressDetailRef.current?.focus();
        }
      }).open();
    }
  };

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !id) return;
    const file = e.target.files[0];
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await api.post(`/seniors/${id}/photo`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setPhotoPreview(res.data.photo_url);
    } catch {
      alert("사진 업로드 실패");
    } finally { setIsUploading(false); }
  };

  const handlePhotoDelete = async () => {
    if (!confirm("사진을 삭제하시겠습니까?")) return;
    if (!id) return;
    try {
      await api.delete(`/seniors/${id}/photo`);
      setPhotoPreview(null);
      alert("사진 삭제 완료");
    } catch {
      alert("사진 삭제 실패");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);
    try {
      await api.put(`/seniors/${id}`, form);
      alert("수정 완료");
      router.push(`/main/users/view/${id}`);
    } catch {
      alert("수정 실패");
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/seniors/${id}`);
      alert("삭제 완료");
      router.push("/main/users/view");
    } catch {
      alert("삭제 실패");
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
    <div className="p-5 bg-white rounded-lg shadow-md max-w-5xl mx-auto text-black">
      <h1 className="text-2xl font-bold mb-4 text-center">이용자 수정</h1>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ----------------- 기본정보 ----------------- */}
        <section>
          <h2 className={sectionTitleClass}>■ 기본정보</h2>
          <table className={tableClass}>
            <tbody>
              <tr>
                <td className={tdClass} rowSpan={5}>
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <div className="relative w-28 h-36 border border-dashed rounded-md flex items-center justify-center bg-gray-50 overflow-hidden">
                      {photoPreview ? (
                        <Image src={photoPreview} alt="사진 미리보기" fill style={{ objectFit: "cover" }} />
                      ) : (
                        <span className="text-gray-400 text-sm">사진</span>
                      )}
                      {isUploading && <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-sm">업로드 중...</span>}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => photoInputRef.current?.click()} className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">사진 첨부</button>
                      {photoPreview && (
                        <button type="button" onClick={handlePhotoDelete} className="text-sm bg-red-200 px-3 py-1 rounded hover:bg-red-300">삭제</button>
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} ref={photoInputRef} className="hidden" />
                  </div>
                </td>
                <th className={thClass}>이름{requiredLabel}</th>
                <td className={tdClass}>
                  <input name="name" value={form.name} onChange={handleChange} className={`${inputClass} w-full ${form.name ? filledInputClass : 'bg-white'}`} required />
                </td>
                <th className={thClass}>생년월일 (나이){requiredLabel}</th>
                <td className={tdClass}>
                  <div className="flex items-center gap-1">
                    <input name="year" value={birth.year} onChange={handleBirthChange} className={`${inputClass} w-20 text-center`} placeholder="YYYY" maxLength={4} required />
                    <span className="mr-2">년</span>
                    <input name="month" value={birth.month} onChange={handleBirthChange} className={`${inputClass} w-14 text-center`} placeholder="MM" maxLength={2} required />
                    <span className="mr-2">월</span>
                    <input name="day" value={birth.day} onChange={handleBirthChange} className={`${inputClass} w-14 text-center`} placeholder="DD" maxLength={2} required />
                    <span className="mr-2">일</span>
                    <span>(만</span>
                    <input readOnly value={age ?? ""} className={`${inputClass} w-15 text-center mx-1`} />
                    <span>세)</span>
                  </div>
                </td>
              </tr>
              <tr>
                <th className={thClass}>성별{requiredLabel}</th>
                <td className={tdClass}>
                  <select name="sex" value={form.sex} onChange={handleChange} className={`${inputClass} w-full bg-white`} required>
                    <option value="">선택</option>
                    <option value="MALE">남</option>
                    <option value="FEMALE">여</option>
                  </select>
                </td>
                <th className={thClass}>연락처{requiredLabel}</th>
                <td className={tdClass}>
                  <input name="phone" value={form.phone} onChange={handlePhoneChange} className={`${inputClass} w-full bg-white`} placeholder="010-1234-5678" required />
                </td>
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
                      <button type="button" onClick={handleZipSearch} disabled={!isScriptLoaded} className="bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-600 disabled:bg-gray-400">
                        {isScriptLoaded ? "우편번호 검색" : "서비스 로딩 중"}
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
                        <input
                          type="radio"
                          name="residence"
                          value={res.key}
                          checked={form.residence === res.key}
                          onChange={handleChange}
                          className="w-4 h-4"
                          required={index === 0}
                        /> {res.value}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ----------------- 건강상태 ----------------- */}
        <section>
          <h2 className={sectionTitleClass}>■ 건강상태</h2>
          <table className={tableClass}>
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

        {/* ----------------- 보호자 ----------------- */}
        <section>
          <h2 className={sectionTitleClass}>■ 보호자</h2>
          <table className={tableClass}>
            <tbody>
              <tr>
                <th className={thClass}>이름{requiredLabel}</th>
                <td className={tdClass}><input name="guardian_name" value={form.guardian_name} onChange={handleChange} className={`${inputClass} w-full bg-white`} required /></td>
                <th className={thClass}>관계{requiredLabel}</th>
                <td className={tdClass}>
                  <select name="relationship" value={form.relationship} onChange={handleChange} className={`${inputClass} w-full bg-white`} required>
                    <option value="">선택</option>
                    {relationshipOptions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <th className={thClass}>연락처</th>
                <td className={tdClass}><input name="guardian_phone" value={form.guardian_phone} onChange={handlePhoneChange} className={`${inputClass} w-full bg-white`} placeholder="010-1234-5678" /></td>
                <th className={thClass}>비고</th>
                <td className={tdClass}><input name="guardian_note" value={form.guardian_note} onChange={handleChange} className={`${inputClass} w-full bg-white`} /></td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ----------------- 참고사항 ----------------- */}
        <section>
          <h2 className={sectionTitleClass}>■ 참고사항</h2>
          <textarea name="note" value={form.note} onChange={handleChange} rows={3} className={`${inputClass} w-full bg-white`} />
        </section>

        {/* ----------------- 최근 분석 ----------------- */}
        <section>
          <h2 className={sectionTitleClass}>■ 최근 분석</h2>
          {analyses.length > 0 ? (
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>분석명</th>
                  <th className={thClass}>날짜</th>
                  <th className={thClass}>결과</th>
                </tr>
              </thead>
              <tbody>
                {analyses.map(a => (
                  <tr key={a.id}>
                    <td className={tdClass}>{a.title}</td>
                    <td className={tdClass}>{a.date}</td>
                    <td className={tdClass}>{a.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>최근 분석이 없습니다.</p>}
        </section>

        {/* ----------------- 수정 / 삭제 버튼 ----------------- */}
        <div className="flex justify-center gap-4 pt-4">
          <button type="submit" disabled={isSubmitting} className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
            {isSubmitting ? "수정 중..." : "수정"}
          </button>
          <button type="button" onClick={handleDelete} className="px-8 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            삭제
          </button>
        </div>

      </form>
    </div>
  );
}
