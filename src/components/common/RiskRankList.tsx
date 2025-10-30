// src/components/common/RiskRankList.tsx
'use client';

import React from 'react';
import type { DashboardSenior } from '@/types';

interface Props {
  seniors: DashboardSenior[];
  selectedSeniorId: number | null;
  onSeniorSelect: (senior: DashboardSenior) => void;
  // optional label to show above list
  riskLevelLabel?: string;
}

export default function RiskRankList({ seniors, selectedSeniorId, onSeniorSelect, riskLevelLabel }: Props) {
  return (
    <div className="md:w-1/3 w-full max-h-[600px] overflow-y-auto border rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">{riskLevelLabel ?? '긴급순'}</h3>
        <div className="text-sm text-gray-500">{seniors.length}건</div>
      </div>

      {seniors.length === 0 ? (
        <div className="text-center text-gray-500 py-10">표시할 데이터가 없습니다.</div>
      ) : (
        seniors
          .slice() // copy
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .map((senior, idx) => {
            const isSelected = selectedSeniorId === senior.senior_id;
            return (
              <article
                key={senior.overall_result_id}
                onClick={() => onSeniorSelect(senior)}
                className={`cursor-pointer p-3 mb-3 rounded-lg border transition ${
                  isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'
                }`}
                role="button"
                aria-pressed={isSelected}
              >
                <header className="flex justify-between items-start">
                  <div className="text-sm text-gray-600">#{idx + 1}</div>
                  <div className="text-right text-xs text-gray-400">{new Date(senior.timestamp).toLocaleString()}</div>
                </header>

                <div className="mt-1">
                  <h4 className="font-semibold text-black text-md">{senior.name} <span className="text-sm text-gray-500">({senior.age}세)</span></h4>
                  <div className="text-sm text-gray-600 mt-1">
                    {senior.sex} · {senior.gu} {senior.dong}
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
                  <div className="text-gray-400">결과ID: {senior.overall_result_id}</div>
                </footer>
              </article>
            );
          })
      )}
    </div>
  );
}