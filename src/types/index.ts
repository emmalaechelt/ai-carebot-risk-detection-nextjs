// --- 인증 및 회원 ---
export interface Member {
  username: string;
  role: "ROLE_ADMIN" | "ROLE_MEMBER";
  enabled: boolean;
}

// --- 페이징 응답 ---
export interface PagedResponse<T> {
  content: T[];
  page_number: number;
  page_size: number;
  total_elements: number;
  total_pages: number;
  is_last: boolean;
  is_first: boolean;
}

// --- 시니어 상태 타입 ---
export type SeniorState = "POSITIVE" | "DANGER" | "CRITICAL" | "EMERGENCY";
export type SeniorSex = "MALE" | "FEMALE";

// [수정] Residence 타입을 이미지에 맞게 enum으로 변경
export enum Residence {
  SINGLE_FAMILY_HOME = '단독주택',
  MULTIPLEX_HOUSING = '다세대주택',
  OFFICETEL = '오피스텔',
  APARTMENT = '아파트',
}

// --- 시니어 상세 정보 ---
export interface Senior {
  id: number;
  doll_id: string;
  name: string;
  birth_date: string;
  sex: SeniorSex;
  phone: string;
  address: string;
  address_detail: string; 
  residence: Residence | ""; 
  diseases?: string;
  medications?: string;
  disease_note?: string; 
  guardian_name: string;
  relationship: string;
  guardian_phone: string;
  guardian_note?: string;
  note?: string;
  photo: string | null;
  recent_overall_results?: {
    id: number;
    label: SeniorState;
    summary: string;
    timestamp: string;
  }[];
}

// --- 시니어 목록 조회용 축약 정보 ---
export interface SeniorListView {
  senior_id: number;
  name: string;
  age: number;
  sex: SeniorSex;
  gu: string;
  dong: string;
  state: SeniorState;
  doll_id: string;
  phone: string;
  created_at: string; // "YYYY-MM-DDTHH:mm:ss"
}

// --- 분석 결과 ---
export interface OverallResult {
  overall_result_id: number;
  label: SeniorState;
  summary: string;
  timestamp: string;
  doll_id: string;
  senior_id: number;
  name: string;
  age: number;
  sex: SeniorSex;
  gu: string;
  dong: string;
}

// --- 대시보드 ---
export interface DashboardData {
  state_count: {
    total: number;
    positive: number;
    danger: number;
    critical: number;
    emergency: number;
  };
  recent_urgent_results: OverallResult[];
}

export interface DollListView {
  id: string;              // 인형의 고유 ID
  senior_id: number | null; // 할당된 시니어 ID (없으면 null)
}
