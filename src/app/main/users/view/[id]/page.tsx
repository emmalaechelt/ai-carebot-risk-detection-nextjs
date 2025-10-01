// src/app/main/users/view/[id]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Senior } from '@/types';
import Image from 'next/image';

// 상세 정보 항목을 렌더링하기 위한 헬퍼 컴포넌트
function DetailItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="col-span-2 text-sm text-gray-900">{value || '-'}</dd>
    </div>
  );
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // URL에서 [id] 값을 가져옴

  const [senior, setSenior] = useState<Senior | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchSenior = async () => {
        setLoading(true);
        try {
          // API 명세서에 따라 /seniors/{id}로 요청
          const response = await api.get<Senior>(`/seniors/${id}`);
          setSenior(response.data);
        } catch (err) {
          console.error('Failed to fetch senior data:', err);
          setError('이용자 정보를 불러오는 데 실패했습니다.');
        } finally {
          setLoading(false);
        }
      };
      fetchSenior();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!senior) return;
    if (window.confirm(`'${senior.name}' 이용자 정보를 정말 삭제하시겠습니까? 삭제된 정보는 복구할 수 없습니다.`)) {
      try {
        await api.delete(`/seniors/${senior.id}`);
        alert('이용자 정보가 삭제되었습니다.');
        // 삭제 후 목록 페이지로 이동
        router.push('/main/users/view');
      } catch (err) {
        console.error('Failed to delete senior:', err);
        alert('삭제 중 오류가 발생했습니다. 다시 시도해 주세요.');
      }
    }
  };

  if (loading) return <div className="text-center p-10 text-gray-600">이용자 정보를 불러오는 중...</div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
  if (!senior) return <div className="text-center p-10 text-gray-500">해당 이용자 정보를 찾을 수 없습니다.</div>;
  
  // 나이 계산
  const age = new Date().getFullYear() - new Date(senior.birth_date).getFullYear();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black">이용자 상세 정보</h1>
        <button 
          onClick={() => router.push('/main/users/view')} 
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm font-semibold"
        >
          목록으로 돌아가기
        </button>
      </div>

      {/* 기본 정보 섹션 */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="flex flex-col items-center lg:items-start">
            <div className="relative w-36 h-36">
              <Image
                src={senior.photo_url || '/img/default-avatar.png'} // public/img/default-avatar.png가 필요합니다.
                alt={`${senior.name}님의 사진`}
                fill
                sizes="144px"
                className="rounded-full object-cover border-4 border-gray-200"
                priority
              />
            </div>
            <h2 className="text-xl font-bold mt-4 text-center lg:text-left">{senior.name}</h2>
            <p className="text-sm text-gray-500">{senior.sex === 'MALE' ? '남성' : '여성'}, 만 {age}세</p>
          </div>

          <div className="lg:col-span-3">
            <h3 className="font-semibold text-lg text-black border-b pb-2 mb-2">기본 정보</h3>
            <dl>
              <DetailItem label="등록번호" value={senior.id} />
              <DetailItem label="인형 ID" value={senior.doll_id} />
              <DetailItem label="현재 상태" value={senior.state} />
              <DetailItem label="생년월일" value={senior.birth_date} />
              <DetailItem label="연락처" value={senior.phone} />
              <DetailItem label="주소" value={`${senior.address} (${senior.gu}, ${senior.dong})`} />
              <DetailItem label="거주 형태" value={senior.residence} />
              <DetailItem label="특이사항" value={senior.note} />
            </dl>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 보호자 정보 섹션 */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold text-lg text-black border-b pb-2 mb-2">보호자 정보</h3>
          <dl>
            <DetailItem label="이름" value={senior.guardian_name} />
            <DetailItem label="관계" value={senior.relationship} />
            <DetailItem label="연락처" value={senior.guardian_phone} />
            <DetailItem label="참고사항" value={senior.guardian_note} />
          </dl>
        </div>
        {/* 건강 상태 섹션 */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold text-lg text-black border-b pb-2 mb-2">건강 상태</h3>
          <dl>
            <DetailItem label="질병" value={senior.diseases} />
            <DetailItem label="복용 약물" value={senior.medications} />
            <DetailItem label="상세 내용" value={senior.disease_note} />
          </dl>
        </div>
      </div>

      {/* 최근 분석 결과 섹션 */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="font-semibold text-lg text-black border-b pb-2 mb-4">최근 분석 결과 (최대 5건)</h3>
        {senior.recent_overall_results && senior.recent_overall_results.length > 0 ? (
          <div className="space-y-3">
            {senior.recent_overall_results.map(result => (
              <div key={result.id} className="border rounded-lg p-3 hover:bg-gray-50">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{result.summary}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(result.timestamp).toLocaleString('ko-KR')}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full text-white ${
                    result.label === 'EMERGENCY' ? 'bg-red-500' :
                    result.label === 'CRITICAL' ? 'bg-orange-500' :
                    result.label === 'DANGER' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>{result.label}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">최근 분석 결과가 없습니다.</p>
        )}
      </div>

      {/* 버튼 영역 */}
      <div className="flex justify-end space-x-2 mt-6">
        {/* 정보 수정 기능은 API 명세에 PUT /seniors/{id}가 있으므로 구현 가능합니다.
            router.push(`/main/users/edit/${senior.id}`) 와 같은 형태로 수정 페이지를 만들어 연동할 수 있습니다.*/}
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold">
          정보 수정
        </button> 
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold"
        >
          이용자 삭제
        </button>
      </div>
    </div>
  );
}