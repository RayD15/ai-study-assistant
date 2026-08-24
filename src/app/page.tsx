"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  FileText,
  Layers,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Logo, ThemeToggle } from "@/components/ui-bits";

const features = [
  {
    icon: FileText,
    title: "Upload Materi",
    desc: "Masukkan PDF, TXT, atau copy-paste materi. AI membacanya sebagai konteks belajar.",
  },
  {
    icon: Layers,
    title: "Ringkasan Otomatis",
    desc: "Pilih ringkasan singkat, normal, atau detail sesuai kebutuhan belajarmu.",
  },
  {
    icon: BrainCircuit,
    title: "Quiz Generator",
    desc: "Soal pilihan ganda, true/false, dan essay dibuat otomatis dari materimu.",
  },
  {
    icon: Sparkles,
    title: "Explain Like I'm Beginner",
    desc: "Konsep sulit dijelaskan dengan analogi sederhana, misalnya untuk anak SMP.",
  },
  {
    icon: Trophy,
    title: "Gamification",
    desc: "Kumpulkan XP, naik level, dan buka badge agar belajar tetap seru.",
  },
];

const steps = [
  {
    n: "1",
    title: "Daftar & Masuk",
    desc: "Buat akun gratis dalam hitungan detik.",
  },
  {
    n: "2",
    title: "Upload Materi",
    desc: "PDF, TXT, atau tempel teks pelajaranmu.",
  },
  {
    n: "3",
    title: "Belajar dengan AI",
    desc: "Rangkuman, quiz, flashcard, dan penjelasan.",
  },
  {
    n: "4",
    title: "Lacak Progress",
    desc: "XP, streak, dan statistik belajarmu.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Fitur</a>
            <a href="#how-it-works" className="hover:text-foreground">Cara Kerja</a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="hidden rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover sm:inline-block"
            >
              Mulai Gratis
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Belajar lebih cepat dengan{" "}
            <span className="text-primary">asisten AI</span> pribadimu
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Upload materi pelajaran, dapatkan rangkuman, quiz, flashcard, dan
            penjelasan sederhana. Semua gratis, dibuat untuk pelajar SMP, SMA,
            dan SMK.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Start Learning with AI
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-lg border border-border px-6 py-3 font-medium transition-colors hover:bg-muted"
            >
              Masuk
            </Link>
          </div>

          {/* Dashboard preview mockup */}
          <div className="relative mx-auto mt-16 max-w-4xl overflow-hidden rounded-xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <span className="text-xs text-muted-foreground">
                dashboard — Ray Study Assistant
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 p-6 text-left sm:grid-cols-4">
              {[
                ["XP", "1.250", "text-yellow-500"],
                ["Level", "5 - Learner", "text-primary"],
                ["Streak", "7 hari", "text-orange-500"],
                ["Avg Score", "84%", "text-green-500"],
              ].map(([label, value, color]) => (
                <div key={label} className="rounded-lg border border-border p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border px-6 py-4 text-left">
              <p className="mb-3 text-sm font-medium">Materi Terbaru</p>
              <div className="space-y-2">
                {[
                  "Algoritma dan Pemrograman.pdf",
                  "Trigonometri.pdf",
                  "Teks Eksplanasi.txt",
                ].map((m) => (
                  <div
                    key={m}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <FileText size={16} className="text-primary" />
                    {m}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-border bg-card/50 py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-bold sm:text-4xl">
              Semua yang kamu butuhkan untuk belajar
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
              Enam fitur inti yang mengubah materi pelajaran menjadi pengalaman
              belajar interaktif.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-bold sm:text-4xl">
              Cara kerjanya
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s) => (
                <div key={s.n} className="relative text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {s.n}
                  </span>
                  <h3 className="mt-4 font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-card/50 py-20">
          <div className="mx-auto w-full max-w-3xl px-4 text-center sm:px-6">
            <BookOpen className="mx-auto text-primary" size={36} />
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              Siap mengubah cara belajarmu?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Gratis, tanpa biaya tersembunyi. Cukup daftar dan mulai upload
              materi pertamamu.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Start Learning with AI
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-green-500" />
            Dibuat untuk portfolio oleh Rayhand
          </div>
        </div>
      </footer>
    </div>
  );
}
