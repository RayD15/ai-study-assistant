import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, ensureSchema } from "@/lib/db";
import { aiSummary } from "@/lib/gemini";
import { aiRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  const rl = aiRateLimit(user.id, "summary");
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
      length?: "singkat" | "normal" | "detail";
    };

    if (!body.materialId) {
      return NextResponse.json({ error: "Pilih materi dulu." }, { status: 400 });
    }

    await ensureSchema();

    const db = getDb();
    const result = await db.execute({
      sql: "SELECT title, content FROM materials WHERE id = ? AND user_id = ?",
      args: [body.materialId, user.id],
    });
    const row = result.rows[0];

    if (!row) {
      return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
    }

    const length = body.length ?? "normal";
    const summary = await aiSummary(String(row.content), length);

    return NextResponse.json({
      summary,
      materialTitle: String(row.title),
      length,
    });
  } catch (err) {
    console.error("AI summary error:", err);
    const message =
      err instanceof Error ? err.message : "Gagal membuat ringkasan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
