"use client";

import { useState, useEffect, useRef, ChangeEvent, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import api from "@/lib/api";
import { Residence, SeniorSex } from "@/types";

// 선택 옵션
const relationshipOptions = ["자녀", "배우자", "부모", "형제자매", "친척", "기타"];
const residenceOptions: { key: string; value: string }[] = [
  { key: "SINGLE_FAMILY_HOME", value: "단독주택" },
  { key: "MULTIPLEX_HOUSING", value: "다세대주택" },
  { key: "MULTI_FAMILY_HOUSING", value: "다가구주택" },
  { key: "APARTMENT", value: "아파트" },
];

// 유틸 함수
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

// DaumPostcode 타입
interface DaumPostcodeData { zonecode: string; roadAddress: string; sigungu: string; bname: string; }
interface PostcodeOptions { oncomplete: (data: DaumPostcodeData) => void; }
interface PostcodeInstance { open(): void; }
interface PostcodeConstructor { new (options: PostcodeOptions): PostcodeInstance; }
declare global { interface Window { daum?: { Postcode: PostcodeConstructor; }; } }

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
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // 기존 데이터 로딩
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const res = await api.get(`/seniors/${id}`);
        const data = res.data;
        setForm({
          doll_id: data.doll_id ?? "", name: data.name ?? "", birth_date: data.birth_date ?? "",
          sex: data.sex ?? "", phone: data.phone ?? "", zip_code: "", address: data.address ?? "",
          address_detail: "", gu: data.gu ?? "", dong: data.dong ?? "", residence: data.residence ?? "",
          status: data.status ?? "정상", diseases: data.diseases ?? "", medications: data.medications ?? "",
          disease_note: data.disease_note ?? "", guardian_name: data.guardian_name ?? "", relationship: data.relationship ?? "",
          guardian_phone: data.guardian_phone ?? "", guardian_note: data.guardian_note ?? "", note: data.note ?? "",
        });
        setBirth({
          year: data.birth_date?.slice(0, 4) ?? "",
          month: data.birth_date?.slice(5, 7) ?? "",
          day: data.birth_date?.slice(8, 10) ?? "",
        });
        setAge(calculateAge(data.birth_date ?? ""));
        setPhotoPreview(data.photo_url ?? null);
      } catch (err) {
        console.error(err);
        alert("데이터 로딩 실패");
      }
    };
    fetchData();
  }, [id]);

  // birth 변경 시 form.birth_date 업데이트 및 나이 계산
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
        oncomplete: (data) => {
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

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = { ...form };
      const formData = new FormData();
      formData.append("senior", new Blob([JSON.stringify(payload)], { type: "application/json" }));
      if (photo) formData.append("photo", photo);
      await api.put(`/seniors/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      alert("수정 완료");
      router.push(`/view/${id}`);
    } catch (err) {
      console.error(err);
      alert("수정 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-5 bg-white rounded-lg shadow-md max-w-5xl mx-auto text-black">
      <h1 className="text-2xl font-bold mb-4 text-center">이용자 수정</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 사진 + 기본정보 */}
        <section>
          <h2 className="text-lg font-semibold mb-1.5">■ 기본정보</h2>
          <div className="flex items-center gap-4">
            <div className="relative w-28 h-36 border border-dashed rounded-md flex items-center justify-center bg-gray-50 overflow-hidden">
              {photoPreview ? <Image src={photoPreview} alt="사진 미리보기" fill style={{ objectFit: "cover" }} /> : <span className="text-gray-400 text-sm">사진</span>}
            </div>
            <div className="flex flex-col gap-2">
              <input type="file" accept="image/*" onChange={handlePhotoChange} ref={photoInputRef} className="hidden" />
              <button type="button" onClick={() => photoInputRef.current?.click()} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">사진 첨부</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <input name="name" value={form.name} onChange={handleChange} placeholder="이름" className="border px-2 py-1 rounded w-full" required />
            <div className="flex gap-2">
              <input name="year" value={birth.year} onChange={handleBirthChange} placeholder="YYYY" className="border px-2 py-1 w-20" maxLength={4} required />
              <input name="month" value={birth.month} onChange={handleBirthChange} placeholder="MM" className="border px-2 py-1 w-14" maxLength={2} required />
              <input name="day" value={birth.day} onChange={handleBirthChange} placeholder="DD" className="border px-2 py-1 w-14" maxLength={2} required />
              <input readOnly value={age ?? ""} className="border px-2 py-1 w-16 text-center" /> 세
            </div>
            <select name="sex" value={form.sex} onChange={handleChange} required className="border px-2 py-1 rounded w-full">
              <option value="">성별 선택</option>
              <option value="MALE">남</option>
              <option value="FEMALE">여</option>
            </select>
            <input name="phone" value={form.phone} onChange={handlePhoneChange} placeholder="010-1234-5678" className="border px-2 py-1 rounded w-full" required />
          </div>
        </section>

        {/* 주소 */}
        <section>
          <h2 className="text-lg font-semibold mb-1.5">■ 주소</h2>
          <div className="flex gap-2 items-center">
            <input name="zip_code" value={form.zip_code} readOnly placeholder="우편번호" className="border px-2 py-1 w-32 bg-gray-100" />
            <button type="button" onClick={handleZipSearch} disabled={!isScriptLoaded} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400">
              우편번호 검색
            </button>
          </div>
          <input name="address" value={form.address} readOnly placeholder="주소" className="border px-2 py-1 w-full bg-gray-100 mt-1" />
          <input name="address_detail" ref={addressDetailRef} value={form.address_detail} onChange={handleChange} placeholder="상세주소" className="border px-2 py-1 w-full mt-1" />
        </section>

        {/* 거주 형태 */}
        <section>
          <h2 className="text-lg font-semibold mb-1.5">■ 거주 형태</h2>
          <div className="flex gap-4 flex-wrap">
            {residenceOptions.map((res, index) => (
              <label key={res.key} className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="residence" value={res.key} checked={form.residence === res.key} onChange={handleChange} required={index === 0} /> {res.value}
              </label>
            ))}
          </div>
        </section>

        {/* 보호자 */}
        <section>
          <h2 className="text-lg font-semibold mb-1.5">■ 보호자</h2>
          <div className="grid grid-cols-2 gap-4">
            <input name="guardian_name" value={form.guardian_name} onChange={handleChange} placeholder="이름" className="border px-2 py-1 w-full" required />
            <select name="relationship" value={form.relationship} onChange={handleChange} required className="border px-2 py-1 w-full">
              <option value="">관계 선택</option>
              {relationshipOptions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <input name="guardian_phone" value={form.guardian_phone} onChange={handlePhoneChange} placeholder="010-1234-5678" className="border px-2 py-1 w-full" />
            <input name="guardian_note" value={form.guardian_note} onChange={handleChange} placeholder="비고" className="border px-2 py-1 w-full" />
          </div>
        </section>

        {/* 건강 상태 */}
        <section>
          <h2 className="text-lg font-semibold mb-1.5">■ 건강 상태</h2>
          <div className="grid grid-cols-2 gap-4">
            <input name="diseases" value={form.diseases} onChange={handleChange} placeholder="질병" className="border px-2 py-1 w-full" />
            <input name="medications" value={form.medications} onChange={handleChange} placeholder="복용 약물" className="border px-2 py-1 w-full" />
          </div>
          <textarea name="disease_note" value={form.disease_note} onChange={handleChange} rows={3} placeholder="상세 증상" className="border px-2 py-1 w-full mt-1" />
        </section>

        {/* 참고사항 */}
        <section>
          <h2 className="text-lg font-semibold mb-1.5">■ 참고사항</h2>
          <textarea name="note" value={form.note} onChange={handleChange} rows={3} placeholder="참고사항" className="border px-2 py-1 w-full" />
        </section>

        <div className="flex justify-center gap-4 pt-4">
          <button type="submit" disabled={isSubmitting} className="px-8 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            {isSubmitting ? "수정 중..." : "수정"}
          </button>
        </div>
      </form>
    </div>
  );
}
