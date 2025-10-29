// src/components/common/RiskRankList.tsx
'use client';

import type { DashboardSenior, RiskLevel } from '@/types';

interface RiskRankListProps {
  seniors: DashboardSenior[];
  selectedSeniorId: number | null;
  onSeniorSelect: (senior: DashboardSenior) => void;
  riskLevel: RiskLevel;
}

const levelConfig: Record<RiskLevel, { label: string }> = {
  EMERGENCY: { label: '긴급' },
  CRITICAL: { label: '위험' },
  DANGER: { label: '주의' },
  POSITIVE: { label: '안전' },
};

export default function RiskRankList({
  seniors,
  selectedSeniorId,
  onSeniorSelect,
  riskLevel,
}: RiskRankListProps) {
  const riskLevelLabel = levelConfig[riskLevel].label;

  return (
    <div className="w-full md:w-1/3 h-[600px] ml-0 md:ml-4 mt-4 md:mt-0 p-3 bg-white rounded-lg shadow-xl">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 sticky top-0 bg-white pt-1 pb-2 z-10 border-b">
        {riskLevelLabel} 목록 (최신순)
      </h3>
      <div className="overflow-y-auto h-[calc(100%-48px)] space-y-3 pr-1">
        {seniors.length > 0 ? (
          seniors.map((senior, index) => (
            <div
              key={senior.senior_id}
              onClick={() => onSeniorSelect(senior)}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                selectedSeniorId === senior.senior_id
                  ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-300'
                  : 'border-gray-200 hover:bg-gray-50 hover:border-blue-400'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-base text-gray-900">
                  {index + 1}. {senior.name}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  ({senior.sex === 'MALE' ? '남' : '여'}, {senior.age}세)
                </span>
              </div>
              <div className="text-sm text-gray-600">
                위치: {senior.gu} {senior.dong}
              </div>
              <div className="text-xs text-gray-400 mt-2 text-right">
                일시: {new Date(senior.timestamp).toLocaleString('ko-KR')}
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-center p-4 text-gray-500">
              {riskLevel === 'POSITIVE'
                ? "안전 상태의 이용자는 이 목록에 표시되지 않습니다."
                : `해당 상태의 이용자가 없습니다.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}