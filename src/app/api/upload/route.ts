import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import formidable from "formidable";

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const form = new formidable.IncomingForm({
    uploadDir: uploadsDir,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024,
  });

  return new Promise((resolve) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error(err);
        return resolve(NextResponse.json({ message: "파일 업로드 오류" }, { status: 500 }));
      }

      const uploadedFiles: Record<string, string> = {};
      if (files.photo) {
        const file = Array.isArray(files.photo) ? files.photo[0] : files.photo;
        uploadedFiles[file.originalFilename || "file"] = `/uploads/${path.basename(file.filepath)}`;
      }

      resolve(NextResponse.json({ message: "업로드 성공", fields, files: uploadedFiles }));
    });
  });
}