'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import StatusSummary from '@/components/common/StatusSummary';
import RiskRankMap from '@/components/common/RiskRankMap';
import RiskRankList from '@/components/common/RiskRankList';
import { DashboardSenior, RiskLevel, DashboardData, SeniorsByState } from '@/types';

const DEFAULT_MAP_CENTER = { lat: 36.3504, lng: 127.3845 };

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-white shadow-sm animate-pulse h-36"></div>
      <div className="border rounded-lg p-3 bg-white shadow-sm animate-pulse h-[500px]"></div>
    </div>
  );
}

interface DashboardDataWithState extends Omit<DashboardData, 'recent_urgent_results'> {
  recent_urgent_results: DashboardSenior[];
  seniors_by_state: SeniorsByState;
}

const RISK_LABEL_MAP: Record<RiskLevel, string> = {
  EMERGENCY: '긴급',
  CRITICAL: '위험',
  DANGER: '주의',
  POSITIVE: '안전',
};

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardDataWithState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<RiskLevel>('EMERGENCY');
  const [selectedSenior, setSelectedSenior] = useState<DashboardSenior | null>(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_MAP_CENTER);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await api.get<DashboardData>('/dashboard');
      const dashboardData = response.data;

      const seniorsByState: SeniorsByState = {
        EMERGENCY: [],
        CRITICAL: [],
        DANGER: [],
        POSITIVE: [],
      };
      (dashboardData.recent_urgent_results || []).forEach((senior) => {
        const label = senior.label as RiskLevel;
        if (seniorsByState[label]) seniorsByState[label].push(senior);
      });

      Object.keys(seniorsByState).forEach((key) => {
        seniorsByState[key as RiskLevel].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });

      setData({ ...dashboardData, seniors_by_state: seniorsByState });
    } catch {
      setError('대시보드 데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const filteredSeniors = useMemo(() => {
    if (!data) return [];
    return data.seniors_by_state[selectedLevel]?.filter(s => s.latitude && s.longitude) || [];
  }, [data, selectedLevel]);

  useEffect(() => {
    if (selectedSenior && !filteredSeniors.some(s => s.senior_id === selectedSenior.senior_id)) {
      setSelectedSenior(null);
    }
  }, [filteredSeniors, selectedSenior]);

  useEffect(() => {
    if (selectedSenior?.latitude && selectedSenior?.longitude) {
      setMapCenter({ lat: selectedSenior.latitude, lng: selectedSenior.longitude });
    } else if (filteredSeniors.length > 0 && filteredSeniors[0].latitude && filteredSeniors[0].longitude) {
      setMapCenter({ lat: filteredSeniors[0].latitude, lng: filteredSeniors[0].longitude });
    } else {
      setMapCenter(DEFAULT_MAP_CENTER);
    }
  }, [selectedSenior, filteredSeniors]);

  const handleLevelSelect = (level: RiskLevel) => {
    setSelectedLevel(level);
    setSelectedSenior(null);
  };

  const handleSeniorSelect = (senior: DashboardSenior) => {
    setSelectedSenior(senior);
  };

  const handleInfoWindowClick = (senior?: DashboardSenior) => {
    if (!senior || !senior.overall_result_id) return;
    router.push(`/analysis/${senior.overall_result_id}/page`);
  };

  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;
  if (loading && !data) return <DashboardSkeleton />;
  if (!data) return <p className="text-center mt-10 text-gray-600">표시할 데이터가 없습니다.</p>;

  return (
    <div className="container mx-auto space-y-6">
      <StatusSummary
        counts={data.state_count}
        selectedLevel={selectedLevel}
        onSelectLevel={handleLevelSelect}
      />
      <div className="flex flex-col md:flex-row gap-4">
        <RiskRankMap
          seniors={filteredSeniors}
          selectedSenior={selectedSenior}
          mapCenter={mapCenter}
          onMarkerClick={handleSeniorSelect}
          onInfoWindowClick={handleInfoWindowClick}
        />
        <RiskRankList
          seniors={filteredSeniors}
          selectedSeniorId={selectedSenior?.senior_id || null}
          onSeniorSelect={handleSeniorSelect}
          riskLevel={selectedLevel}
        />
      </div>
    </div>
  );
}