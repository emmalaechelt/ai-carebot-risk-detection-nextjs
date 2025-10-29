// src/hooks/useDashboardData.ts

import useSWR from 'swr';
import api from '@/lib/api';
import { useMemo } from 'react';
import type { DashboardData, SeniorsByState, DashboardSenior } from '@/types';

const fetcher = (url: string) => api.get<DashboardData>(url).then(res => res.data);

interface ProcessedDashboardData {
  state_count: DashboardData['state_count'];
  seniors_by_state: SeniorsByState;
}

export function useDashboardData() {
  const { data, error, isLoading } = useSWR<DashboardData>('/dashboard', fetcher, {
    refreshInterval: 60000,
  });

  const processedData: ProcessedDashboardData | null = useMemo(() => {
    // ✅ [핵심 수정] 
    // data가 존재하고, data.recent_urgent_results가 배열인지까지 확인합니다.
    // 이렇게 하면 초기 렌더링 시 data가 undefined일 때 오류가 발생하지 않습니다.
    if (!data || !Array.isArray(data.recent_urgent_results)) {
      return null;
    }

    const groupedSeniors: SeniorsByState = {
      EMERGENCY: [],
      CRITICAL: [],
      DANGER: [],
      POSITIVE: [],
    };

    data.recent_urgent_results.forEach(senior => {
      // senior.label은 항상 RiskLevel 중 하나이므로, 항상 groupedSeniors의 유효한 키가 됩니다.
      groupedSeniors[senior.label].push(senior);
    });

    return {
      state_count: data.state_count,
      seniors_by_state: groupedSeniors,
    };
  }, [data]);

  return {
    data: processedData,
    isLoading,
    isError: error,
  };
}