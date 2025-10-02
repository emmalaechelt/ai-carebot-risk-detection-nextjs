// src/app/main/users/view/[id]/page.tsx
"use client";

import { useState, useEffect, useRef, ChangeEvent, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Script from "next/script";
import api from "@/lib/api";
import { Residence, SeniorSex, Senior } from "@/types";

// [추가] API의 위험도(label)를 한글과 색상으로 변환하는 헬퍼 함수
const getStatusInfo = (label: string | undefined) => {
  switch (label) {
    case "EMERGENCY":
    case "CRITICAL":
      return { text: "긴급", color: "bg-red-500 text-white" };
    case "DANGER":
      return { text: "위험", color: "bg-yellow-400 text-black" };
    case "POSITIVE":
      return { text: "안전", color: "bg-green-500 text-white" };
    default:
      return { text: "정상", color: "bg-gray-100 text-black" };
  }
};

const relationshipOptions = ["자녀", "배우자", "부모", "형제자매", "친척", "기타"];

export default function UserViewPage() {
  const router = useRouter();
  const params = useParams();
  const seniorId = params.id as string;

  const [form, setForm] = useState<Senior | null>(null);
  const [birth, setBirth] = useState({ year: "", month: "", day: "" });
  const [age, setAge] = useState<number | null>(null);
  const [status, setStatus] = useState({ text: "로딩중...", color: "bg-gray-200" });
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const addressDetailRef = useRef<HTMLInputElement>(null);

  // 데이터 로딩 Effect
  useEffect(() => {
    if (!seniorId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. 시니어 정보 조회
        const seniorRes = await api.get<Senior>(`/seniors/${seniorId}`);
        const seniorData = seniorRes.data;
        setForm(seniorData);

        // 생년월일 분리
        if (seniorData.birth_date) {
          const [year, month, day] = seniorData.birth_date.split("-");
          setBirth({ year, month, day });
          setAge(calculateAge(seniorData.birth_date));
        }
        
        // 2. 분석 결과 조회
        if(seniorData.doll_id) {
          const analyzeRes = await api.get<any[]>(`/analyze`);
          const seniorAnalysis = analyzeRes.data.find(
            (result) => result.doll_id === seniorData.doll_id
          );
          setStatus(getStatusInfo(seniorAnalysis?.label));
        } else {
          setStatus(getStatusInfo(undefined));
        }

      } catch (error) {
        console.error("데이터 로딩 실패:", error);
        alert("사용자 정보를 불러오는 데 실패했습니다.");
        router.push("/main/users/list"); // 목록 페이지로 이동 (가정)
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [seniorId, router]);
  
  // 생년월일 변경 시 나이 재계산
  useEffect(() => {
    if (birth.year.length === 4 && birth.month && birth.day) {
        const fullDate = `${birth.year}-${birth.month.padStart(2, "0")}-${birth.day.padStart(2, "0")}`;
        setAge(calculateAge(fullDate));
        setForm(prev => prev ? {...prev, birth_date: fullDate} : null);
    }
  }, [birth]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => prev ? { ...prev, [name]: value } : null);
  };
  const handleBirthChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBirth(prev => ({ ...prev, [name]: value.replace(/\D/g, "") }));
  };
  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const formatted = value.replace(/\D/g, "").replace(/(\d{3})(\d{1,4})?(\d{1,4})?/, (_, p1, p2, p3) => {
        let result = p1;
        if (p2) result += `-${p2}`;
        if (p3) result += `-${p3}`;
        return result;
      }).slice(0, 13);
    setForm(prev => prev ? { ...prev, [name]: formatted } : null);
  };
   const handleResidenceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    const residenceValue = value as Residence;
    setForm((prev) => {
      if (!prev) return null;
      const currentResidences = Array.isArray(prev.residence) ? prev.residence : [];
      const newResidences = checked
        ? [...currentResidences, residenceValue]
        : currentResidences.filter((r) => r !== residenceValue);
      return { ...prev, residence: newResidences };
    });
  };
  const handleZipSearch = () => {
    new (window as any).daum.Postcode({
      oncomplete: (data: any) => {
        setForm(prev => prev ? { ...prev, zip_code: data.zonecode, address: data.roadAddress } : null);
        addressDetailRef.current?.focus();
      },
    }).open();
  };

  // [수정] handleSubmit -> handleUpdate
  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !form) return;
    
    setIsSubmitting(true);
    try {
      // API 명세에 따라 전송할 데이터만 추림 (사진 제외)
      const updateData = {
        doll_id: form.doll_id,
        name: form.name,
        birth_date: form.birth_date,
        sex: form.sex,
        phone: form.phone,
        address: `${form.address} ${form.address_detail}`,
        note: form.note,
        guardian_name: form.guardian_name,
        guardian_phone: form.guardian_phone,
        relationship: form.relationship,
        guardian_note: form.guardian_note,
        diseases: form.diseases,
        medications: form.medications,
      };
      
      await api.put(`/seniors/${seniorId}`, updateData);
      alert("정보가 성공적으로 수정되었습니다.");
      setIsEditing(false); // 수정 모드 종료
    } catch (err) {
      console.error("이용자 수정 실패:", err);
      alert("수정 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // [추가] 삭제 핸들러
  const handleDelete = async () => {
    if (window.confirm("정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
        try {
            await api.delete(`/seniors/${seniorId}`);
            alert("사용자가 삭제되었습니다.");
            router.push("/main/users/list"); // 목록 페이지로 이동 (가정)
        } catch (error) {
            console.error("삭제 실패:", error);
            alert("삭제 중 오류가 발생했습니다.");
        }
    }
  };

  if (isLoading || !form) {
    return <div className="p-6 text-center">로딩 중...</div>;
  }

  // --- 스타일 ---
  const sectionTitleClass = "text-lg font-semibold text-gray-800 mb-2";
  const tableBorderClass = "border-gray-300";
  const thClass = `border-b lg:border ${tableBorderClass} bg-gray-50 font-medium p-2 text-left lg:text-center align-middle whitespace-nowrap`;
  const tdClass = `border-b lg:border ${tableBorderClass} p-2 align-middle`;
  const inputClass = "border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-sm w-full disabled:bg-gray-100 disabled:text-gray-500";
  const requiredLabel = <span className="text-red-500 ml-1">*</span>;
  const mobileCellWrapperClass = "flex flex-col lg:table-cell";

  return (
    <>
      <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="afterInteractive" />
      <div className="p-4 lg:p-6 bg-white rounded-lg shadow-md max-w-5xl mx-auto text-black">
        {/* [수정] 제목을 폼 바깥으로 */}
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">이용자 상세 정보</h1>
            {/* [추가] 수정/삭제 버튼 */}
            {!isEditing && (
                 <div className="flex gap-2">
                    <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">수정</button>
                    <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">삭제</button>
                 </div>
            )}
        </div>
        
        <form onSubmit={handleUpdate} className="space-y-6">
          <section>
            <h2 className={sectionTitleClass}>■ 기본정보</h2>
            <div className={`border ${tableBorderClass} lg:grid lg:grid-cols-[136px_1fr]`}>
              <div className={`${tdClass} flex justify-center items-center p-4 lg:row-span-5`}>
                 <div className="w-28 h-36 border border-dashed rounded-md flex items-center justify-center bg-gray-50">
                    <span className="text-gray-400 text-sm">사진</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className={mobileCellWrapperClass}>
                  <label className={thClass}>이름{requiredLabel}</label>
                  <div className={tdClass}><input name="name" value={form.name} onChange={handleChange} className={inputClass} required disabled={!isEditing} /></div>
                </div>
                <div className={mobileCellWrapperClass}>
                  <label className={thClass}>생년월일 (나이){requiredLabel}</label>
                  <div className={tdClass}>
                    <div className="flex items-center gap-1 flex-wrap">
                      <input name="year" value={birth.year} onChange={handleBirthChange} className={`${inputClass} !w-20 text-center`} placeholder="YYYY" maxLength={4} required disabled={!isEditing} />
                      <span>년</span>
                      <input name="month" value={birth.month} onChange={handleBirthChange} className={`${inputClass} !w-14 text-center`} placeholder="MM" maxLength={2} required disabled={!isEditing} />
                      <span>월</span>
                      <input name="day" value={birth.day} onChange={handleBirthChange} className={`${inputClass} !w-14 text-center`} placeholder="DD" maxLength={2} required disabled={!isEditing} />
                      <span>일</span>
                      <div className="flex items-center ml-2">(만 
                        <input readOnly value={age ?? ""} className={`${inputClass} !w-12 text-center bg-gray-100 mx-1`} />
                      세)</div>
                    </div>
                  </div>
                </div>
                <div className={mobileCellWrapperClass}>
                  <label className={thClass}>성별{requiredLabel}</label>
                  <div className={tdClass}><select name="sex" value={form.sex} onChange={handleChange} className={inputClass} required disabled={!isEditing}><option value="">선택</option><option value="MALE">남</option><option value="FEMALE">여</option></select></div>
                </div>
                <div className={mobileCellWrapperClass}>
                  <label className={thClass}>연락처{requiredLabel}</label>
                  <div className={tdClass}><input name="phone" value={form.phone} onChange={handlePhoneChange} className={inputClass} placeholder="010-1234-5678" required disabled={!isEditing} /></div>
                </div>
                 <div className={mobileCellWrapperClass}>
                  <label className={thClass}>현재 상태</label>
                  <div className={tdClass}>
                    <input value={status.text} readOnly className={`${inputClass} text-center font-bold ${status.color}`} />
                  </div>
                </div>
                <div className={mobileCellWrapperClass}>
                  <label className={thClass}>인형 아이디</label>
                  <div className={tdClass}><input name="doll_id" value={form.doll_id} onChange={handleChange} className={inputClass} disabled={!isEditing}/></div>
                </div>
                <div className={`${mobileCellWrapperClass} lg:col-span-2`}>
                  <label className={thClass}>주소{requiredLabel}</label>
                  <div className={`${tdClass} space-y-2`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <input name="zip_code" value={form.zip_code} readOnly placeholder="우편번호" className={`${inputClass} !w-24 bg-gray-100`} />
                      <button type="button" onClick={handleZipSearch} className="bg-blue-500 text-white px-4 py-1.5 rounded-md text-sm hover:bg-blue-600 whitespace-nowrap" disabled={!isEditing}>우편번호 검색</button>
                      <input name="address" value={form.address} readOnly placeholder="주소" className={`${inputClass} bg-gray-100 flex-grow min-w-[200px]`} />
                    </div>
                    <input name="address_detail" ref={addressDetailRef} value={form.address_detail} onChange={handleChange} placeholder="상세주소" className={inputClass} disabled={!isEditing}/>
                  </div>
                </div>
                <div className={`${mobileCellWrapperClass} lg:col-span-2`}>
                  <label className={thClass}>거주 형태</label>
                  <div className={tdClass}>
                    <div className="flex items-center gap-4 flex-wrap py-1">
                      {Object.values(Residence).map((res) => (<label key={res} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" value={res} checked={Array.isArray(form.residence) && form.residence.includes(res)} onChange={handleResidenceChange} className="w-4 h-4" disabled={!isEditing}/>
                          {res}
                        </label>))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ... 이하 건강상태, 보호자 정보 등도 동일한 패턴으로 disabled={!isEditing}을 적용 ... */}
          <section>
            <h2 className={sectionTitleClass}>■ 건강상태</h2>
            <div className={`grid grid-cols-1 lg:grid-cols-2 border ${tableBorderClass}`}>
              <div className={mobileCellWrapperClass}>
                <label className={thClass}>질병</label>
                <div className={tdClass}><input name="diseases" value={form.diseases} onChange={handleChange} className={inputClass} disabled={!isEditing}/></div>
              </div>
              <div className={mobileCellWrapperClass}>
                <label className={thClass}>복용 약물</label>
                <div className={tdClass}><input name="medications" value={form.medications} onChange={handleChange} className={inputClass} disabled={!isEditing}/></div>
              </div>
              <div className={`${mobileCellWrapperClass} lg:col-span-2`}>
                <label className={thClass}>상세 증상</label>
                <div className={tdClass}><textarea name="disease_note" value={form.disease_note} onChange={handleChange} rows={3} className={inputClass} disabled={!isEditing}></textarea></div>
              </div>
            </div>
          </section>
          
          <section>
            <h2 className={sectionTitleClass}>■ 보호자</h2>
            <div className={`grid grid-cols-1 lg:grid-cols-2 border ${tableBorderClass}`}>
              <div className={mobileCellWrapperClass}>
                <label className={thClass}>이름</label>
                <div className={tdClass}><input name="guardian_name" value={form.guardian_name} onChange={handleChange} className={inputClass} disabled={!isEditing}/></div>
              </div>
               <div className={mobileCellWrapperClass}>
                <label className={thClass}>연락처</label>
                <div className={tdClass}><input name="guardian_phone" value={form.guardian_phone} onChange={handlePhoneChange} className={inputClass} placeholder="010-1234-5678" disabled={!isEditing}/></div>
              </div>
              <div className={mobileCellWrapperClass}>
                <label className={thClass}>이용자와의 관계</label>
                <div className={tdClass}>
                  <select name="relationship" value={form.relationship} onChange={handleChange} className={inputClass} disabled={!isEditing}>
                    <option value="">선택</option>
                    {relationshipOptions.map((option) => (<option key={option} value={option}>{option}</option>))}
                  </select>
                </div>
              </div>
              <div className={mobileCellWrapperClass}>
                <label className={thClass}>참고사항</label>
                <div className={tdClass}><input name="guardian_note" value={form.guardian_note} onChange={handleChange} className={inputClass} disabled={!isEditing}/></div>
              </div>
            </div>
          </section>

          <section>
            <h2 className={sectionTitleClass}>■ 이외 참고사항</h2>
            <div className={`border ${tableBorderClass}`}>
              <div className={mobileCellWrapperClass}>
                <label className={thClass}>참고사항</label>
                <div className={tdClass}><textarea name="note" value={form.note} onChange={handleChange} rows={3} className={inputClass} disabled={!isEditing}></textarea></div>
              </div>
            </div>
          </section>
          
          {/* [수정] 수정 모드일 때만 저장/취소 버튼 보이기 */}
          {isEditing && (
            <div className="flex justify-center pt-4 gap-4">
                <button type="button" onClick={() => { setIsEditing(false); /* window.location.reload(); */ }} className="w-full lg:w-auto px-8 py-2.5 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600">
                    취소
                </button>
                <button type="submit" disabled={isSubmitting} className="w-full lg:w-auto px-8 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                    {isSubmitting ? "저장 중..." : "저장"}
                </button>
            </div>
          )}
        </form>
      </div>
    </>
  );
}

// [추가] calculateAge, Senior, Residence, SeniorSex 등 필요한 타입/함수가 없으면 여기에 추가
const calculateAge = (birthDate: string): number | null => {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};