"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  BrainCircuit,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Layers,
  Loader2,
  MessageSquareText,
  Send,
  Shuffle,
  Sparkles,
  User as UserIcon,
  X,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";

type Material = {
  id: number;
  title: string;
  subject: string | null;
  fileType: string;
  createdAt: string;
};

type ChatMsg = { role: "user" | "assistant"; content: string };

type QuizQuestionDto = { id: number; question: string; options: string[] };

type QuizResult = {
  score: number;
  correct: number;
  total: number;
  xp: { earnedXp: number; level: number; leveledUp: number[] };
  review: {
    question: string;
    options: string[];
    correctAnswer: number;
    userAnswer: number | null;
    isCorrect: boolean;
    explanation: string;
  }[];
};

type FlashcardDto = { id?: number; question: string; answer: string; mastered?: boolean };

type Tab = "chat" | "summary" | "quiz" | "flashcard" | "explain";

const tabs: { id: Tab; label: string; icon: typeof Bot }[] = [
  { id: "chat", label: "AI Chat", icon: MessageSquareText },
  { id: "summary", label: "Summary", icon: Layers },
  { id: "quiz", label: "Quiz", icon: BrainCircuit },
  { id: "flashcard", label: "Flashcard", icon: FileText },
  { id: "explain", label: "Explain", icon: Sparkles },
];

export default function WorkspacePage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialId, setMaterialId] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("chat");
  const [loadingMaterials, setLoadingMaterials] = useState(true);

  useEffect(() => {
    fetch("/api/materials")
      .then((r) => r.json())
      .then((d) => {
        setMaterials(d.materials ?? []);
        if (d.materials?.length > 0) setMaterialId(d.materials[0].id);
      })
      .finally(() => setLoadingMaterials(false));
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Study Workspace"
        subtitle="Pilih materi, lalu belajar dengan AI."
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Material sidebar */}
        <aside className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">MATERI</h2>
          {loadingMaterials ? (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 size={14} className="animate-spin" /> Memuat...
            </div>
          ) : materials.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-3 text-xs leading-relaxed text-muted-foreground">
              Belum ada materi. Upload dulu di halaman Library.
            </p>
          ) : (
            <div className="space-y-1.5">
              {materials.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMaterialId(m.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    materialId === m.id
                      ? "bg-primary/10 font-medium text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <FileText size={15} className="shrink-0" />
                  <span className="truncate">{m.title}</span>
                </button>
              ))}
            </div>
          )}
          <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
            AI menjawab berdasarkan materi yang dipilih.
          </p>
        </aside>

        {/* Main panel */}
        <section className="min-w-0 rounded-xl border border-border bg-card">
          <div className="grid grid-cols-5 border-b border-border lg:flex lg:overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium transition-colors sm:text-xs lg:flex-row lg:gap-2 lg:whitespace-nowrap lg:px-5 lg:py-3.5 lg:text-sm ${
                  tab === id
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-6">
            {!materialId && tab !== "chat" ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Pilih materi terlebih dahulu. Belum punya? Upload di Library.
              </p>
            ) : (
              <>
                {tab === "chat" && <ChatPanel materialId={materialId} />}
                {tab === "summary" && <SummaryPanel materialId={materialId} />}
                {tab === "quiz" && <QuizPanel materialId={materialId} />}
                {tab === "flashcard" && <FlashcardPanel materialId={materialId} />}
                {tab === "explain" && <ExplainPanel materialId={materialId} />}
              </>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}

/* ---------------- AI Chat ---------------- */

function ChatPanel({ materialId }: { materialId: number | null }) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Halo. Aku asisten belajarmu. Tanyakan apa saja — jika kamu memilih materi, aku akan menjawab berdasarkan materinya.",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || thinking) return;
    setInput("");
    setError(null);

    const history = messages.filter((m) => m !== messages[0]);
    setMessages((m) => [...m, { role: "user", content }]);
    setThinking(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId, history, question: content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal mendapat jawaban.");
      setMessages((m) => [...m, { role: "assistant", content: data.answer }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="flex h-[min(560px,calc(100dvh-16rem))] min-h-[380px] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot size={16} />
              </span>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background"
              }`}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <UserIcon size={16} />
              </span>
            )}
          </div>
        ))}
        {thinking && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={14} className="animate-spin" /> AI sedang mengetik...
          </div>
        )}
        {error && <ErrorBox message={error} />}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="mt-4 flex items-center gap-2 border-t border-border pt-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanyakan sesuatu tentang materi ini..."
          className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          disabled={!input.trim() || thinking}
          aria-label="Kirim"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

/* ---------------- Summary ---------------- */

function SummaryPanel({ materialId }: { materialId: number | null }) {
  const [length, setLength] = useState<"singkat" | "normal" | "detail">("normal");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId, length }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat ringkasan.");
      setSummary(data.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">Panjang ringkasan:</span>
        {(["singkat", "normal", "detail"] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLength(l)}
            className={`rounded-lg px-4 py-1.5 text-sm capitalize transition-colors ${
              length === l
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:bg-muted"
            }`}
          >
            {l}
          </button>
        ))}
        <button
          onClick={generate}
          disabled={loading}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          Generate Ringkasan
        </button>
      </div>

      {error && <ErrorBox message={error} />}

      {loading && (
        <div className="space-y-2 py-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${90 - i * 10}%` }} />
          ))}
        </div>
      )}

      {summary && !loading && (
        <div className="whitespace-pre-wrap rounded-lg border border-border bg-background p-5 text-sm leading-relaxed">
          {summary}
        </div>
      )}
    </div>
  );
}

/* ---------------- Quiz ---------------- */

function QuizPanel({ materialId }: { materialId: number | null }) {
  const [phase, setPhase] = useState<"idle" | "playing" | "result">("idle");
  const [questions, setQuestions] = useState<QuizQuestionDto[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateQuiz() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId, count: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat quiz.");
      quizIdRef.current = data.quizId;
      setQuestions(data.questions);
      setAnswers(Array(data.questions.length).fill(null));
      setCurrent(0);
      setPhase("playing");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setGenerating(false);
    }
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      if (!quizIdRef.current) throw new Error("Quiz belum dibuat.");
      const res = await fetch(`/api/quizzes/${quizIdRef.current}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal submit quiz.");
      setResult(data);
      setPhase("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  }

  // simpan quizId dari generate
  const quizIdRef = useRef<number | null>(null);

  if (phase === "idle") {
    return (
      <div className="py-12 text-center">
        <BrainCircuit size={40} className="mx-auto text-primary" />
        <h3 className="mt-4 text-lg font-semibold">Quiz dari materimu</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          AI membuat soal pilihan ganda dan true/false dari materi yang dipilih,
          lengkap dengan pembahasan.
        </p>
        {error && <div className="mx-auto mt-4 max-w-md"><ErrorBox message={error} /></div>}
        <button
          onClick={generateQuiz}
          disabled={generating || !materialId}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {generating ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Membuat soal...
            </>
          ) : (
            <>
              <Sparkles size={16} /> Generate Quiz
            </>
          )}
        </button>
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-background p-6 text-center">
          <p className="text-sm text-muted-foreground">Quiz selesai</p>
          <p className="mt-1 text-4xl font-bold text-primary">{result.score}%</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Benar: {result.correct} / {result.total} — +{result.xp.earnedXp} XP
          </p>
          {result.xp.leveledUp.length > 0 && (
            <p className="mt-2 inline-block rounded-full bg-yellow-500/10 px-4 py-1 text-sm font-semibold text-yellow-600 dark:text-yellow-400">
              Naik ke Level {result.xp.level}
            </p>
          )}
        </div>

        <div className="space-y-3">
          {result.review.map((r, i) => (
            <div key={i} className="rounded-xl border border-border bg-background p-4">
              <p className="flex items-start gap-2 text-sm font-medium">
                {r.isCorrect ? (
                  <Check size={16} className="mt-0.5 shrink-0 text-green-500" />
                ) : (
                  <X size={16} className="mt-0.5 shrink-0 text-red-500" />
                )}
                {i + 1}. {r.question}
              </p>
              <p className="mt-2 text-xs">
                Jawabanmu:{" "}
                <span className={r.isCorrect ? "text-green-600" : "text-red-500"}>
                  {r.userAnswer !== null ? r.options[r.userAnswer] : "tidak dijawab"}
                </span>
                {!r.isCorrect && (
                  <>
                    {" "}— Benar:{" "}
                    <span className="text-green-600">{r.options[r.correctAnswer]}</span>
                  </>
                )}
              </p>
              {r.explanation && (
                <p className="mt-2 rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
                  Pembahasan: {r.explanation}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => {
              setPhase("idle");
              setResult(null);
              setQuestions([]);
            }}
            className="rounded-lg border border-border px-5 py-2 text-sm font-medium hover:bg-muted"
          >
            Buat Quiz Lagi
          </button>
        </div>
      </div>
    );
  }

  // playing
  const q = questions[current];
  const answeredCount = answers.filter((a) => a !== null).length;

  return (
    <div>
      {error && <div className="mb-4"><ErrorBox message={error} /></div>}
      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Pertanyaan {current + 1} dari {questions.length}
        </span>
        <span>{answeredCount}/{questions.length} terjawab</span>
      </div>
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>

      <h3 className="font-semibold">{q.question}</h3>
      <div className="mt-4 space-y-2">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() =>
              setAnswers((a) => a.map((v, idx) => (idx === current ? i : v)))
            }
            className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
              answers[current] === i
                ? "border-primary bg-primary/10 font-medium"
                : "border-border hover:bg-muted"
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                answers[current] === i
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {String.fromCharCode(65 + i)}
            </span>
            {opt}
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          <ChevronLeft size={16} /> Sebelumnya
        </button>
        {current === questions.length - 1 ? (
          <button
            onClick={submit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Submit Jawaban
          </button>
        ) : (
          <button
            onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Berikutnya <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------- Flashcard ---------------- */

function FlashcardPanel({ materialId }: { materialId: number | null }) {
  const [cards, setCards] = useState<FlashcardDto[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [order, setOrder] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat flashcard.");
      setCards(data.flashcards);
      setOrder(data.flashcards.map((_: unknown, i: number) => i));
      setIndex(0);
      setFlipped(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }, [materialId]);

  async function toggleMastered(card: FlashcardDto) {
    const newState = !card.mastered;
    setCards((cs) =>
      cs.map((c, i) => (order[index] === i ? { ...c, mastered: newState } : c)),
    );
    await fetch("/api/flashcards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        materialId,
        question: card.question,
        mastered: newState,
      }),
    });
  }

  const hasCards = cards.length > 0;

  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader2 size={28} className="mx-auto animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">AI sedang membuat flashcard...</p>
      </div>
    );
  }

  if (!hasCards) {
    return (
      <div className="py-12 text-center">
        <FileText size={40} className="mx-auto text-muted-foreground opacity-50" />
        <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
          Belum ada flashcard untuk materi ini. Generate otomatis dari isi materi.
        </p>
        {error && <div className="mx-auto mt-4 max-w-md"><ErrorBox message={error} /></div>}
        <button
          onClick={loadCards}
          disabled={!materialId}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          <Sparkles size={16} /> Generate Flashcard
        </button>
      </div>
    );
  }

  const card = cards[order[index]];

  return (
    <div className="mx-auto max-w-lg py-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Kartu {index + 1} dari {cards.length}
        </span>
        <button
          onClick={loadCards}
          className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
        >
          <Sparkles size={13} /> Regenerate
        </button>
      </div>

      <button
        onClick={() => setFlipped(!flipped)}
        className="mt-4 flex min-h-52 w-full flex-col items-center justify-center rounded-xl border border-border bg-background p-8 text-center shadow-sm transition-transform active:scale-[0.98]"
      >
        {!flipped ? (
          <>
            <span className="text-xs font-medium uppercase tracking-wide text-primary">
              Pertanyaan
            </span>
            <span className="mt-3 text-lg font-medium">{card.question}</span>
            <span className="mt-6 text-xs text-muted-foreground">
              Klik untuk melihat jawaban
            </span>
          </>
        ) : (
          <>
            <span className="text-xs font-medium uppercase tracking-wide text-green-600">
              Jawaban
            </span>
            <span className="mt-3 text-base leading-relaxed">{card.answer}</span>
          </>
        )}
      </button>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => {
            setIndex((i) => Math.max(0, i - 1));
            setFlipped(false);
          }}
          disabled={index === 0}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40"
        >
          <ChevronLeft size={15} /> Prev
        </button>
        <button
          onClick={() => toggleMastered(card)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            card.mastered
              ? "bg-green-500/10 text-green-600"
              : "border border-border hover:bg-muted"
          }`}
        >
          <Check size={15} />
          {card.mastered ? "Mastered" : "Tandai Mastered"}
        </button>
        <button
          onClick={() => {
            setIndex((i) => Math.min(cards.length - 1, i + 1));
            setFlipped(false);
          }}
          disabled={index === cards.length - 1}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40"
        >
          Next <ChevronRight size={15} />
        </button>
      </div>

      <button
        onClick={() => {
          setOrder((o) => [...o].sort(() => Math.random() - 0.5));
          setIndex(0);
          setFlipped(false);
        }}
        className="mx-auto mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <Shuffle size={15} />
        Acak urutan kartu
      </button>
    </div>
  );
}

/* ---------------- Explain ---------------- */

function ExplainPanel({ materialId }: { materialId: number | null }) {
  const [level, setLevel] = useState("anak SMP");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function explain() {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId, topic, level }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membuat penjelasan.");
      setExplanation(data.explanation);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="explain-topic" className="text-sm font-medium">
          Konsep yang ingin dijelaskan
        </label>
        <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
          <input
            id="explain-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Contoh: recursion, fotosintesis, teks eksplanasi..."
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option>anak SMP</option>
            <option>anak SMA</option>
            <option>pemula total</option>
          </select>
          <button
            onClick={explain}
            disabled={loading || !topic.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            Jelaskan
          </button>
        </div>
      </div>

      {error && <ErrorBox message={error} />}

      {explanation && !loading && (
        <div className="whitespace-pre-wrap rounded-lg border border-border bg-background p-5 text-sm leading-relaxed">
          {explanation}
        </div>
      )}
    </div>
  );
}
