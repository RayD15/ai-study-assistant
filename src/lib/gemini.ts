import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-3.6-flash";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AiError(
        "GEMINI_API_KEY belum disetel. Ambil gratis di https://aistudio.google.com/apikey",
      );
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export class AiError extends Error {}

/** System prompt sesuai PRD: study assistant, bukan chatbot biasa. */
export const STUDY_ASSISTANT_RULES = `You are an AI Study Assistant.

Your goal is to help students understand educational materials clearly and accurately.

Rules:
1. Explain concepts in simple language.
2. Use examples when appropriate.
3. Do not intentionally give false information.
4. If the answer is not available in the provided material, clearly say that the information is not found in the material.
5. Encourage the student to understand the concept rather than simply memorizing the answer.
6. Always respond in Indonesian (Bahasa Indonesia).`;

/** Batasi ukuran konteks materi agar hemat kuota free tier. */
export function clampMaterial(content: string, maxChars = 12000): string {
  if (content.length <= maxChars) return content;
  return content.slice(0, maxChars) + "\n\n[...materi dipotong karena terlalu panjang...]";
}

async function generate(prompt: string): Promise<string> {
  const ai = getClient();

  // Retry sederhana untuk error sementara (503 high demand dsb.)
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: { systemInstruction: STUDY_ASSISTANT_RULES },
      });
      return response.text ?? "";
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      // Hanya retry untuk error server/kapasitas, bukan kesalahan API key
      if (!msg.includes("503") && !msg.includes("429") && !msg.includes("overload")) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw lastErr;
}

export async function aiChat(
  materialContent: string | null,
  history: { role: "user" | "assistant"; content: string }[],
  question: string,
): Promise<string> {
  const parts: string[] = [];

  if (materialContent) {
    parts.push(
      `Berikut materi pelajaran yang menjadi konteks percakapan:\n\n<material>\n${clampMaterial(materialContent)}\n</material>`,
    );
  }

  for (const m of history.slice(-10)) {
    parts.push(`${m.role === "user" ? "Student" : "You"}: ${m.content}`);
  }

  parts.push(`Student: ${question}`);

  return generate(parts.join("\n\n"));
}

export async function aiSummary(
  materialContent: string,
  length: "singkat" | "normal" | "detail",
): Promise<string> {
  const lengthGuide = {
    singkat: "3-5 poin utama saja",
    normal: "poin-poin penting dengan penjelasan singkat per poin",
    detail: "penjelasan menyeluruh per bagian materi, tetap terstruktur",
  }[length];

  return generate(
    `Buatkan ringkasan materi berikut (${lengthGuide}). Gunakan bahasa Indonesia yang mudah dipahami pelajar, format bernomor.\n\n<material>\n${clampMaterial(materialContent)}\n</material>`,
  );
}

export async function aiExplain(
  materialContent: string | null,
  topic: string,
  level: string,
): Promise<string> {
  return generate(
    `Jelaskan konsep "${topic}" untuk ${level}.${
      materialContent ? " Gunakan konteks dari materi berikut jika relevan:\n\n" + clampMaterial(materialContent) : ""
    }\n\nGunakan analogi sederhana dari kehidupan sehari-hari, lalu berikan contoh konkret, dan tutup dengan satu kalimat inti yang merangkum konsepnya.`,
  );
}

export type GeneratedQuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

export async function aiQuiz(
  materialContent: string,
  count = 5,
): Promise<GeneratedQuizQuestion[]> {
  const raw = await generate(
    `Buatkan ${count} soal latihan dari materi berikut. Campuran pilihan ganda (4 opsi) dan true/false (2 opsi).

Format respons HANYA JSON array tanpa teks lain:
[
  {
    "question": "teks pertanyaan",
    "options": ["opsi A", "opsi B", "opsi C", "opsi D"],
    "correctAnswer": 0,
    "explanation": "pembahasan singkat"
  }
]

correctAnswer adalah index opsi benar (mulai dari 0). Semua dalam Bahasa Indonesia.

<material>
${clampMaterial(materialContent)}
</material>`,
  );

  // Ekstrak JSON dari respons (kadang dibungkus ```json ... ```)
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new AiError("AI tidak mengembalikan quiz yang valid.");

  const parsed = JSON.parse(match[0]) as GeneratedQuizQuestion[];
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new AiError("Quiz kosong.");
  }

  // Sanitasi
  return parsed
    .filter((q) => q.question && Array.isArray(q.options) && q.options.length >= 2)
    .map((q) => ({
      question: String(q.question),
      options: q.options.map(String),
      correctAnswer: Math.min(Math.max(0, Number(q.correctAnswer)), q.options.length - 1),
      explanation: String(q.explanation ?? ""),
    }));
}

export type GeneratedFlashcard = { question: string; answer: string };

export async function aiFlashcards(
  materialContent: string,
  count = 6,
): Promise<GeneratedFlashcard[]> {
  const raw = await generate(
    `Buatkan ${count} flashcard belajar dari materi berikut.

Format respons HANYA JSON array tanpa teks lain:
[
  {"question": "pertanyaan", "answer": "jawaban singkat dan jelas"}
]

Semua dalam Bahasa Indonesia.

<material>
${clampMaterial(materialContent)}
</material>`,
  );

  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new AiError("AI tidak mengembalikan flashcard yang valid.");

  const parsed = JSON.parse(match[0]) as GeneratedFlashcard[];
  return parsed
    .filter((f) => f.question && f.answer)
    .map((f) => ({ question: String(f.question), answer: String(f.answer) }));
}
