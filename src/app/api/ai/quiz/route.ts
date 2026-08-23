import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, ensureSchema } from "@/lib/db";
import { aiQuiz, type GeneratedQuizQuestion } from "@/lib/gemini";

/** Generate quiz baru dari materi + simpan ke database. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      materialId?: number;
      count?: number;
    };

    if (!body.materialId) {
      return NextResponse.json({ error: "Pilih materi dulu." }, { status: 400 });
    }

    await ensureSchema();

    const db = getDb();
    const materialResult = await db.execute({
      sql: "SELECT title, content FROM materials WHERE id = ? AND user_id = ?",
      args: [body.materialId, user.id],
    });
    const material = materialResult.rows[0];

    if (!material) {
      return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
    }

    const count = Math.min(Math.max(3, body.count ?? 5), 10);
    const questions: GeneratedQuizQuestion[] = await aiQuiz(
      String(material.content),
      count,
    );

    const title = `Quiz — ${String(material.title)}`;
    const quizResult = await db.execute({
      sql: "INSERT INTO quizzes (user_id, material_id, title, total_questions) VALUES (?, ?, ?, ?)",
      args: [user.id, body.materialId, title, questions.length],
    });
    const quizId = Number(quizResult.lastInsertRowid);

    for (const q of questions) {
      await db.execute({
        sql: "INSERT INTO questions (quiz_id, question, options_json, correct_answer, explanation) VALUES (?, ?, ?, ?, ?)",
        args: [quizId, q.question, JSON.stringify(q.options), q.correctAnswer, q.explanation],
      });
    }

    // Jangan kirim correctAnswer & explanation ke client sebelum submit!
    return NextResponse.json(
      {
        quizId,
        title,
        questions: questions.map((q, i) => ({
          id: i,
          question: q.question,
          options: q.options,
        })),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("AI quiz generate error:", err);
    const message =
      err instanceof Error ? err.message : "Gagal membuat quiz.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
