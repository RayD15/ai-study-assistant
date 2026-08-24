import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, ensureSchema } from "@/lib/db";
import { aiExplain } from "@/lib/gemini";
import { aiRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  const rl = aiRateLimit(user.id, "explain");
  if (!rl.ok) {
    return NextResponse.json(
      {
        error:
          rl.kind === "daily"
            ? "Kuota harian fitur AI tercapai (maksimal 60 request/hari). Coba lagi besok."
            : `Terlalu banyak permintaan. Coba lagi dalam ${rl.retryAfterSec} detik.`,
      },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  try {
    const body = (await req.json()) as {
      materialId?: number;
      topic?: string;
      level?: string;
    };

    const topic = body.topic?.trim() ?? "";
    if (!topic) {
      return NextResponse.json(
        { error: "Tulis konsep yang ingin dijelaskan." },
        { status: 400 },
      );
    }

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

    const level = body.level ?? "anak SMP";
    const explanation = await aiExplain(materialContent, topic, level);

    return NextResponse.json({ explanation });
  } catch (err) {
    console.error("AI explain error:", err);
    const message =
      err instanceof Error ? err.message : "Gagal membuat penjelasan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
