import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, ensureSchema } from "@/lib/db";
import { awardXp } from "@/lib/xp";

/** Tandai flashcard mastered (toggle). */
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  try {
    await ensureSchema();

    const body = (await req.json()) as {
      flashcardId?: number;
      materialId?: number;
      question?: string;
      mastered?: boolean;
    };

    const db = getDb();

    if (body.flashcardId) {
      await db.execute({
        sql: "UPDATE flashcards SET mastered = ? WHERE id = ? AND user_id = ?",
        args: [body.mastered ? 1 : 0, body.flashcardId, user.id],
      });
    } else if (body.materialId && body.question) {
      await db.execute({
        sql: "UPDATE flashcards SET mastered = ? WHERE user_id = ? AND material_id = ? AND question = ?",
        args: [body.mastered ? 1 : 0, user.id, body.materialId, body.question],
      });
    } else {
      return NextResponse.json({ error: "Parameter tidak lengkap." }, { status: 400 });
    }

    // XP kecil saat menandai mastered
    let xpResult = null;
    if (body.mastered) {
      xpResult = await awardXp("flashcard_mastered", 5);
    }

    return NextResponse.json({ ok: true, xp: xpResult });
  } catch (err) {
    console.error("Flashcard update error:", err);
    return NextResponse.json({ error: "Gagal memperbarui flashcard." }, { status: 500 });
  }
}
