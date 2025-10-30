'use client';

import React from 'react';
import type { DashboardSenior, RiskLevel } from '@/types';

interface Props {
  seniors: DashboardSenior[];
  selectedSeniorId: number | null;
  onSeniorSelect: (senior: DashboardSenior) => void;
  riskLevelLabel?: string;
  currentLevel?: RiskLevel; // 카드 색상 기준
}

const riskColors: Record<RiskLevel, { text: string; bg: string; border: string }> = {
  EMERGENCY: { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  CRITICAL: { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  DANGER: { text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  POSITIVE: { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
};

export default function RiskRankList({
  seniors,
  selectedSeniorId,
  onSeniorSelect,
  riskLevelLabel,
}: Props) {
  return (
    <div className="w-full h-full max-h-[600px] overflow-y-auto border rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">{riskLevelLabel ?? '긴급순'}</h3>
        <div className="text-sm text-gray-500">{seniors.length}건</div>
      </div>

      {seniors.length === 0 ? (
        <div className="text-center text-gray-500 py-10">표시할 데이터가 없습니다.</div>
      ) : (
        seniors
          .slice()
          .sort(
            (a, b) =>
              new Date(b.last_state_changed_at).getTime() -
              new Date(a.last_state_changed_at).getTime()
          )
          .map((senior, idx) => {
            const isSelected = selectedSeniorId === senior.senior_id;
            const risk = senior.resolved_label ?? 'POSITIVE'; // 없으면 안전(POSITIVE) 처리
            const color = riskColors[risk];

            return (
              <article
                key={senior.latest_overall_result_id}
                onClick={() => onSeniorSelect(senior)}
                className={`cursor-pointer p-3 mb-3 rounded-lg border transition ${
                  isSelected
                    ? 'border-blue-300 bg-blue-50'
                    : `${color.border} ${color.bg} hover:brightness-95`
                }`}
                role="button"
                aria-pressed={isSelected}
              >
                <header className="flex justify-between items-start">
                  <div className="text-sm text-gray-600">#{idx + 1}</div>
                  <div className="text-right text-xs text-gray-400">
                    {new Date(senior.last_state_changed_at).toLocaleString()}
                  </div>
                </header>

                <div className="mt-1">
                  <h4 className={`font-semibold text-md ${color.text}`}>
                    {senior.name}{' '}
                    <span className="text-sm text-gray-500">({senior.age}세)</span>
                  </h4>
                  <div className="text-sm text-gray-600 mt-1">
                    {senior.sex} · {senior.address}
                  </div>
                </div>
              </article>
            );
          })
      )}
    </div>
  );
}
