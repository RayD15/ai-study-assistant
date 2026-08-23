import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, ensureSchema } from "@/lib/db";
import { aiFlashcards, type GeneratedFlashcard } from "@/lib/gemini";
import { awardXp } from "@/lib/xp";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { materialId?: number; count?: number };

    if (!body.materialId) {
      return NextResponse.json({ error: "Pilih materi dulu." }, { status: 400 });
    }

    await ensureSchema();

    const db = getDb();
    const materialResult = await db.execute({
      sql: "SELECT content FROM materials WHERE id = ? AND user_id = ?",
      args: [body.materialId, user.id],
    });
    const material = materialResult.rows[0];

    if (!material) {
      return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
    }

    const count = Math.min(Math.max(4, body.count ?? 6), 12);
    const cards: GeneratedFlashcard[] = await aiFlashcards(
      String(material.content),
      count,
    );

    // Simpan flashcard ke database (replace set lama untuk materi ini)
    await db.execute({
      sql: "DELETE FROM flashcards WHERE user_id = ? AND material_id = ?",
      args: [user.id, body.materialId],
    });

    for (const c of cards) {
      await db.execute({
        sql: "INSERT INTO flashcards (user_id, material_id, question, answer) VALUES (?, ?, ?, ?)",
        args: [user.id, body.materialId, c.question, c.answer],
      });
    }

    await awardXp("flashcard_generate", 10);

    return NextResponse.json({ flashcards: cards }, { status: 201 });
  } catch (err) {
    console.error("AI flashcards error:", err);
    const message =
      err instanceof Error ? err.message : "Gagal membuat flashcard.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
