'use client';

import React from 'react';
import type { DashboardSenior, RiskLevel } from '@/types';

interface Props {
  seniors: DashboardSenior[];
  selectedSeniorId: number | null;
  onSeniorSelect: (senior: DashboardSenior) => void;
  riskLevelLabel?: string;
  currentLevel?: RiskLevel;
}

const riskColors: Record<
  RiskLevel,
  { text: string; bg: string; border: string; label: string }
> = {
  EMERGENCY: { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: '긴급' },
  CRITICAL: { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: '위험' },
  DANGER: { text: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200', label: '주의' },
  POSITIVE: { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: '안전' },
};

const sexMap: Record<string, string> = {
  MALE: '남',
  FEMALE: '여',
};

export default function RiskRankList({
  seniors,
  selectedSeniorId,
  onSeniorSelect,
  riskLevelLabel,
}: Props) {
  const labelToKorean: Record<string, string> = {
    EMERGENCY: '긴급',
    CRITICAL: '위험',
    DANGER: '주의',
    POSITIVE: '안전',
    긴급: '긴급',
    위험: '위험',
    주의: '주의',
    안전: '안전',
  };

  const displayLevelLabel =
    riskLevelLabel ? labelToKorean[riskLevelLabel] ?? '긴급' : '긴급';

  const displayLevelColor: RiskLevel =
    (Object.keys(riskColors).find(
      key => riskColors[key as RiskLevel].label === displayLevelLabel
    ) as RiskLevel) ?? 'EMERGENCY';

  const levelPriority: Record<RiskLevel, number> = {
    EMERGENCY: 0,
    CRITICAL: 1,
    DANGER: 2,
    POSITIVE: 3,
  };

  // --- ⬇️ 수정된 부분 ---
  // 이유: 상위 컴포넌트에서 이미 필터링된 목록(seniors)을 전달하므로, 내부에서 중복으로 필터링할 경우
  //      '긴급' 상태의 데이터가 누락되는 문제가 발생합니다. 불필요한 필터 로직을 제거하여
  //      전달받은 seniors 목록을 그대로 사용하고 정렬만 수행하도록 수정합니다.
  const filteredSeniors = seniors
    .slice() // 원본 배열 수정을 방지하기 위해 복사본 생성
    .sort((a, b) => {
      const levelA = a.resolved_label ?? 'POSITIVE';
      const levelB = b.resolved_label ?? 'POSITIVE';
      if (levelPriority[levelA] !== levelPriority[levelB]) {
        return levelPriority[levelA] - levelPriority[levelB];
      }
      return (
        new Date(b.last_state_changed_at).getTime() -
        new Date(a.last_state_changed_at).getTime()
      );
    });

  return (
    <div className="w-full h-full max-h-[600px] overflow-y-auto border rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
        <h3 className={`text-lg font-bold ${riskColors[displayLevelColor].text}`}>
          {displayLevelLabel}
        </h3>
        <div className="text-sm text-gray-500 translate-y-[1px]">(최신순)</div>
        </div>
        <div className="text-sm text-gray-500 translate-y-[1px]">{filteredSeniors.length}건</div>
      </div>

      {filteredSeniors.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          표시할 데이터가 없습니다.
        </div>
      ) : (
        filteredSeniors.map((senior, idx) => {
          const isSelected = selectedSeniorId === senior.senior_id;
          const risk = senior.resolved_label ?? displayLevelColor;
          const color = riskColors[risk];
          const sexInKorean = sexMap[senior.sex] ?? senior.sex;

          return (
            <article
              key={`senior-${senior.senior_id ?? 'unknown'}-${senior.latest_overall_result_id ?? idx}`}
              onClick={() => onSeniorSelect(senior)}
              className={
                'cursor-pointer p-2 mb-2 rounded-lg border transition ' +
                (isSelected
                  ? 'border-blue-300 bg-blue-50'
                  : `${color.border} ${color.bg} hover:brightness-95`)
              }
              role="button"
              aria-pressed={isSelected}
            >
              <header className="flex justify-between items-start">
                <div className="text-sm font-semibold text-gray-600">
                  #{idx + 1} {senior.name} ({senior.age}세 / {sexInKorean})
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(senior.last_state_changed_at).toLocaleString()}
                </div>
              </header>
              <div className="mt-1 text-sm text-gray-600">{senior.address}</div>
            </article>
          );
        })
      )}
    </div>
  );
}