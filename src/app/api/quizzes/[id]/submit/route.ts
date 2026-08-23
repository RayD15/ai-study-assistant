import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, ensureSchema } from "@/lib/db";
import { awardXp } from "@/lib/xp";

/** Submit jawaban quiz -> dinilai server (anti-cheat), simpan skor, beri XP. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  try {
    await ensureSchema();

    const { id } = await params;
    const quizId = Number(id);
    const body = (await req.json()) as { answers?: (number | null)[] };
    const answers = body.answers ?? [];

    const db = getDb();
    const quizResult = await db.execute({
      sql: "SELECT id, title, total_questions, score FROM quizzes WHERE id = ? AND user_id = ?",
      args: [quizId, user.id],
    });
    const quiz = quizResult.rows[0];

    if (!quiz) {
      return NextResponse.json({ error: "Quiz tidak ditemukan." }, { status: 404 });
    }

    // Cegah submit ganda (score sudah terisi)
    if (
      quiz.score !== null &&
      quiz.score !== undefined &&
      Number(quiz.score) > 0
    ) {
      return NextResponse.json(
        { error: "Quiz ini sudah pernah disubmit." },
        { status: 409 },
      );
    }

    const questionsResult = await db.execute({
      sql: "SELECT question, options_json, correct_answer, explanation FROM questions WHERE quiz_id = ? ORDER BY id",
      args: [quizId],
    });

    let correct = 0;
    const review = questionsResult.rows.map((q, i) => {
      const options = JSON.parse(String(q.options_json)) as string[];
      const correctAnswer = Number(q.correct_answer);
      const userAnswer = answers[i] ?? null;
      const isCorrect = userAnswer === correctAnswer;
      if (isCorrect) correct += 1;
      return {
        question: String(q.question),
        options,
        correctAnswer,
        userAnswer,
        isCorrect,
        explanation: String(q.explanation ?? ""),
      };
    });

    const total = review.length;
    if (total === 0) {
      return NextResponse.json({ error: "Quiz tidak memiliki soal." }, { status: 400 });
    }
    const score = Math.round((correct / total) * 100);

    await db.execute({
      sql: "UPDATE quizzes SET score = ?, correct_answers = ?, created_at = datetime('now') WHERE id = ?",
      args: [score, correct, quizId],
    });

    // XP: 50 untuk menyelesaikan quiz + bonus skor sempurna
    const xpResult = await awardXp("quiz_complete", 50, score === 100 ? "perfect" : undefined);

    return NextResponse.json({
      score,
      correct,
      total,
      xp: xpResult,
      review,
    });
  } catch (err) {
    console.error("Quiz submit error:", err);
    return NextResponse.json({ error: "Gagal menilai quiz." }, { status: 500 });
  }
}
