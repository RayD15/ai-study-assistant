import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, ensureSchema } from "@/lib/db";
import { aiChat } from "@/lib/gemini";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      materialId?: number;
      history?: { role: "user" | "assistant"; content: string }[];
      question?: string;
    };

    const question = body.question?.trim() ?? "";
    if (!question) {
      return NextResponse.json({ error: "Pertanyaan kosong." }, { status: 400 });
    }

    // Ambil materi sebagai konteks (milik user ini saja)
    let materialContent: string | null = null;
    if (body.materialId) {
      await ensureSchema();
      const db = getDb();
      const result = await db.execute({
        sql: "SELECT content FROM materials WHERE id = ? AND user_id = ?",
        args: [body.materialId, user.id],
      });
      const row = result.rows[0];
      materialContent = row ? String(row.content) : null;
    }

    const answer = await aiChat(materialContent, body.history ?? [], question);

    return NextResponse.json({ answer });
  } catch (err) {
    console.error("AI chat error:", err);
    const message =
      err instanceof Error ? err.message : "Gagal memproses pertanyaan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
