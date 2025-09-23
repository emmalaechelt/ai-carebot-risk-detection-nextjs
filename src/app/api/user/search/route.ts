import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let sql = "SELECT * FROM users WHERE 1=1";
    const values: any[] = [];

    if (body.district) {
      sql += " AND district = ?";
      values.push(body.district);
    }
    if (body.neighborhood) {
      sql += " AND neighborhood = ?";
      values.push(body.neighborhood);
    }
    if (body.status) {
      sql += " AND status = ?";
      values.push(body.status);
    }
    if (body.ageGroup) {
      sql += " AND age_group = ?";
      values.push(body.ageGroup);
    }
    if (body.gender) {
      sql += " AND gender = ?";
      values.push(body.gender);
    }
    if (body.residenceType) {
      sql += " AND residence_type = ?";
      values.push(body.residenceType);
    }
    if (body.userName) {
      sql += " AND user_name LIKE ?";
      values.push(`%${body.userName}%`);
    }
    if (body.phoneNumber) {
      sql += " AND phone_number LIKE ?";
      values.push(`%${body.phoneNumber}%`);
    }
    if (body.personalId) {
      sql += " AND personal_id LIKE ?";
      values.push(`%${body.personalId}%`);
    }
    if (body.dateFrom && body.dateTo) {
      sql += " AND created_at BETWEEN ? AND ?";
      values.push(body.dateFrom, body.dateTo);
    }
    if (body.timeFrom && body.timeTo) {
      sql += " AND TIME(created_at) BETWEEN ? AND ?";
      values.push(body.timeFrom, body.timeTo);
    }

    if (body.userIdOrder === "latest") {
      sql += " ORDER BY id DESC";
    } else {
      sql += " ORDER BY id ASC";
    }

    const [rows] = await pool.query(sql, values);
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "DB 검색 실패" }, { status: 500 });
  }
}