// --- 인증 및 회원 ---
export interface Member {
  username: string;
  role: "ROLE_ADMIN" | "ROLE_MEMBER";
  enabled: boolean;
}

// --- 페이징 응답 (목록 조회 API 공통) ---
export interface PagedResponse<T> {
  content: T[];
  page_number: number;
  page_size: number;
  total_elements: number;
  total_pages: number;
  is_last: boolean;
  is_first: boolean;
}

// --- 시니어 관련 공통 타입 ---
export type SeniorState = "POSITIVE" | "DANGER" | "CRITICAL" | "EMERGENCY";
export type SeniorSex = "MALE" | "FEMALE";

// 리스크 레벨 타입 (문자열 리터럴 타입), SeniorState와 동일하지만 용도 구분을 위해 정의
export type RiskLevel = SeniorState;

// 거주 형태 Enum
export enum Residence {
  SINGLE_FAMILY_HOME = '단독주택',
  MULTIPLEX_HOUSING = '다세대주택',
  MULTI_FAMILY_HOUSING = '다가구주택',
  APARTMENT = '아파트',
}

// --- 시니어 상세 정보 (GET /seniors/{id}) ---
export interface Senior {
  id: number;
  doll_id: string;
  name: string;
  birth_date: string; // "YYYY-MM-DD"
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
  photo: string | null; // photo_url
  recent_overall_results?: {
    id: number;
    label: SeniorState;
    summary: string;
    timestamp: string;
  }[];
}

// --- 시니어 목록 조회용 축약 정보 (GET /seniors) ---
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

// --- 긴급 분석 결과 (대시보드 API 내 사용) ---
export interface UrgentResult {
  overall_result_id: number;
  label: SeniorState;
  senior_name: string;
  age: number;
  sex: SeniorSex;
  gu: string;
  dong: string;
  summary: string;
  treatment_plan?: string; // API 명세서에 따라 optional 처리
  timestamp: string;
}

// --- 대시보드 (GET /dashboard) ---
export interface DashboardData {
  state_count: {
    total: number;
    positive: number;
    danger: number;
    critical: number;
    emergency: number;
    [key: string]: number; // 문자열 키로 접근할 수 있도록 인덱스 서명 추가
  };
  recent_urgent_results: UrgentResult[];
}

// --- 지도 및 목록 컴포넌트에서 사용할 확장된 시니어 타입 ---
// UrgentResult 타입을 기반으로, 지도 좌표(lat, lng)와 호환성 필드(name)를 추가합니다.
export interface RiskSenior extends UrgentResult {
  name?: string;  // 다른 API 응답 필드와의 호환성을 위함
  lat?: number;   // 주소 변환 후 추가될 위도
  lng?: number;   // 주소 변환 후 추가될 경도
}

// --- 인형 목록 조회용 축약 정보 (GET /dolls) ---
export interface DollListView {
  id: string;              // 인형의 고유 ID
  senior_id: number | null; // 할당된 시니어 ID (없으면 null)
}