import { pool } from "@/lib/db";

interface User {
  id: number;
  user_name: string;
  phone_number: string;
  district: string;
  neighborhood: string;
  status: string;
}

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [params.id]);
  const user = (rows as User[])[0];

  if (!user) {
    return <div className="p-5">사용자를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="p-5 space-y-3">
      <h1 className="text-xl font-bold">이용자 상세 정보</h1>
      <p>이름: {user.user_name}</p>
      <p>전화번호: {user.phone_number}</p>
      <p>자치구: {user.district}</p>
      <p>행정동: {user.neighborhood}</p>
      <p>상태: {user.status}</p>
    </div>
  );
}