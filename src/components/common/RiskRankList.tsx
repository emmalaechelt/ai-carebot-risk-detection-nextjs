'use client';

import React from 'react';
import type { DashboardSenior } from '@/types';

interface Props {
  seniors: DashboardSenior[];
  selectedSeniorId: number | null;
  onSeniorSelect: (senior: DashboardSenior) => void;
  riskLevelLabel?: string;
}

export default function RiskRankList({ seniors, selectedSeniorId, onSeniorSelect, riskLevelLabel }: Props) {
  return (
    <div className="w-full h-full max-h-[600px] overflow-y-auto border rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">{riskLevelLabel ?? '긴급순'}</h3>
        <div className="text-sm text-gray-500">{seniors.length}건</div>
      </div>

      {seniors.length === 0 ? (
        <div className="text-center text-gray-500 py-10">표시할 데이터가 없습니다.</div>
      ) : (
        // ✅ [수정됨] 정렬 로직이 부모 컴포넌트로 이동했으므로, 여기서는 제거해도 무방합니다. (유지해도 문제는 없습니다.)
        // 필드명 변경에 따라 정렬 기준을 'last_state_changed_at'으로 수정합니다.
        seniors
          .slice()
          .sort((a, b) => new Date(b.last_state_changed_at).getTime() - new Date(a.last_state_changed_at).getTime())
          .map((senior, idx) => {
            const isSelected = selectedSeniorId === senior.senior_id;
            return (
              // ✅ [수정됨] key를 새로운 ID 필드명으로 변경합니다.
              <article
                key={senior.latest_overall_result_id}
                onClick={() => onSeniorSelect(senior)}
                className={`cursor-pointer p-3 mb-3 rounded-lg border transition ${
                  isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'
                }`}
                role="button"
                aria-pressed={isSelected}
              >
                <header className="flex justify-between items-start">
                  <div className="text-sm text-gray-600">#{idx + 1}</div>
                  {/* ✅ [수정됨] 시간 표시 기준을 'last_state_changed_at'으로 변경합니다. */}
                  <div className="text-right text-xs text-gray-400">{new Date(senior.last_state_changed_at).toLocaleString()}</div>
                </header>

                <div className="mt-1">
                  <h4 className="font-semibold text-black text-md">{senior.name} <span className="text-sm text-gray-500">({senior.age}세)</span></h4>
                  {/* ✅ [수정됨] 'gu'와 'dong' 대신 'address' 필드를 표시합니다. */}
                  <div className="text-sm text-gray-600 mt-1">
                    {senior.sex} · {senior.address}
                  </div>
                  <div className="text-sm text-gray-700 mt-2 line-clamp-2 text-xs">
                    {senior.summary ?? '요약 정보가 없습니다.'}
                  </div>
                </div>

                <footer className="mt-3 flex items-center justify-between text-xs">
                  <div>
                    {senior.is_resolved ? (
                      <span className="px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded">조치 완료</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded">확인 필요</span>
                    )}
                  </div>
                  {/* ✅ [수정됨] 결과 ID를 새로운 필드명으로 변경합니다. */}
                  <div className="text-gray-400">결과ID: {senior.latest_overall_result_id}</div>
                </footer>
              </article>
            );
          })
      )}
    </div>
  );
}