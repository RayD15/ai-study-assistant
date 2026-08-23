import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, ensureSchema } from "@/lib/db";
import { awardXp } from "@/lib/xp";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  await ensureSchema();

  const db = getDb();
  const result = await db.execute({
    sql: "SELECT id, title, subject, file_type, created_at FROM materials WHERE user_id = ? ORDER BY created_at DESC",
    args: [user.id],
  });

  const materials = result.rows.map((row) => ({
    id: Number(row.id),
    title: String(row.title),
    subject: row.subject === null || row.subject === undefined ? null : String(row.subject),
    fileType: String(row.file_type),
    createdAt: String(row.created_at),
  }));

  return NextResponse.json({ materials });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  try {
    await ensureSchema();

    const db = getDb();
    let title: string;
    let content: string;
    let fileType: "pdf" | "txt" | "text";
    let filePath: string | null = null;

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      // Upload file
      const form = await req.formData();
      const file = form.get("file") as File | null;
      title =
        ((form.get("title") as string) ?? "").trim() ||
        file?.name.replace(/\.[^.]+$/, "") ||
        "Tanpa Judul";

      if (!file) {
        return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
      }

      // Validasi ukuran maksimal 10 MB
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "Ukuran file maksimal 10 MB." }, { status: 413 });
      }

      const ext = file.name.toLowerCase().split(".").pop();

      if (ext !== "pdf" && ext !== "txt") {
        return NextResponse.json(
          { error: "Format tidak didukung. Gunakan PDF atau TXT." },
          { status: 415 },
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      if (ext === "pdf") {
        fileType = "pdf";
        const { extractText, getDocumentProxy } = await import("unpdf");
        const pdf = await getDocumentProxy(new Uint8Array(buffer));
        const { text } = await extractText(pdf, { mergePages: true });
        content = text;
      } else {
        fileType = "txt";
        content = buffer.toString("utf-8");
      }
    } else {
      // Paste teks
      const body = (await req.json()) as { title?: string; content?: string };
      title = body.title?.trim() ?? "";
      content = body.content ?? "";
      fileType = "text";

      if (!title) {
        return NextResponse.json({ error: "Judul wajib diisi." }, { status: 400 });
      }
    }

    if (!content.trim()) {
      return NextResponse.json(
        { error: "Isi materi kosong atau tidak dapat dibaca." },
        { status: 400 },
      );
    }

    if (content.length > 500_000) {
      content = content.slice(0, 500_000);
    }

    const result = await db.execute({
      sql: "INSERT INTO materials (user_id, title, content, file_path, file_type) VALUES (?, ?, ?, ?, ?)",
      args: [user.id, title, content, filePath, fileType],
    });

    await awardXp("material_upload", 20, title);

    return NextResponse.json(
      { id: Number(result.lastInsertRowid), title, fileType },
      { status: 201 },
    );
  } catch (err) {
    console.error("Material upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memproses materi." },
      { status: 500 },
    );
  }
}
