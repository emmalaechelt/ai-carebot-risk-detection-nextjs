// src/components/common/StatusSummary.tsx

'use client';

import { RiskLevel } from '@/types';

interface StatusSummaryProps {
  counts: {
    total: number;
    positive: number;
    danger: number;
    critical: number;
    emergency: number;
    [key: string]: number;
  };
  selectedLevel: RiskLevel;
  onSelectLevel: (level: RiskLevel) => void;
}

const levelConfig: Record<RiskLevel, { label: string; colors: string }> = {
  EMERGENCY: { label: '긴급', colors: 'border-red-500 bg-red-50 text-red-600' },
  CRITICAL: { label: '위험', colors: 'border-orange-500 bg-orange-50 text-orange-600' },
  DANGER: { label: '주의', colors: 'border-yellow-500 bg-yellow-50 text-yellow-600' },
  POSITIVE: { label: '안전', colors: 'border-green-500 bg-green-50 text-green-600' },
};

export default function StatusSummary({ counts, selectedLevel, onSelectLevel }: StatusSummaryProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-xl font-bold text-gray-800">전체 현황</h2>
        <p className="text-sm text-gray-600">
          총 이용자 수: <span className="font-semibold text-blue-600">{counts.total}</span>명
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        {(Object.keys(levelConfig) as RiskLevel[]).map((level) => {
          const countKey = level.toLowerCase();
          return (
            <div
              key={level}
              onClick={() => onSelectLevel(level)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-transform duration-200 ${levelConfig[level].colors} ${
                selectedLevel === level
                ? 'ring-4 ring-offset-1 ring-blue-400 transform scale-105 shadow-lg'
                : 'hover:shadow-md hover:-translate-y-1'
              }`}
            >
              <p className="font-semibold text-lg">{levelConfig[level].label}</p>
              <p className="text-4xl font-bold mt-1">{counts[countKey] || 0}<span className="text-xl ml-1">명</span></p>
            </div>
          );
        })}
      </div>
    </div>
  );
}