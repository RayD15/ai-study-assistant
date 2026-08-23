"use client";

import Link from "next/link";
import {
  ArrowRight,
  Flame,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Upload,
  Zap,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { mockMaterials } from "@/lib/mock-data";

type User = {
  id: number;
  name: string;
  username: string | null;
  email: string;
  xp: number;
  level: number;
  streak: number;
};

const LEVEL_NAMES: Record<number, string> = {
  1: "Beginner",
  5: "Learner",
  10: "Scholar",
  20: "Master",
};

function levelName(level: number) {
  const names = [20, 10, 5];
  for (const n of names) {
    if (level >= n) return LEVEL_NAMES[n];
  }
  return LEVEL_NAMES[1];
}

function xpForNext(level: number) {
  return level * 400;
}

export default function DashboardClient({ user }: { user: User }) {
  const currentXp = user.xp;
  const nextXp = xpForNext(user.level);
  const prevXp = xpForNext(user.level - 1);
  const progress = Math.min(
    100,
    Math.max(0, ((currentXp - prevXp) / (nextXp - prevXp)) * 100),
  );

  const stats = [
    { label: "Materi", value: String(mockMaterials.length), icon: Target, color: "text-primary" },
    { label: "Quiz", value: "0", icon: Zap, color: "text-blue-500" },
    { label: "XP", value: currentXp.toLocaleString("id-ID"), icon: Star, color: "text-yellow-500" },
    { label: "Streak", value: `${user.streak} hari`, icon: Flame, color: "text-orange-500" },
    { label: "Avg Score", value: "-", icon: TrendingUp, color: "text-green-500" },
  ];

  return (
    <AppShell>
      <PageHeader
        title={`Halo, ${user.name}`}
        subtitle="Ini ringkasan perkembangan belajarmu."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <Icon size={18} className={color} />
            <p className="mt-2 text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Level progress */}
      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Trophy size={18} />
            </span>
            <div>
              <p className="font-semibold">
                Level {user.level} — {levelName(user.level)}
              </p>
              <p className="text-xs text-muted-foreground">
                {nextXp - currentXp} XP lagi menuju Level {user.level + 1}
              </p>
            </div>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {currentXp.toLocaleString("id-ID")} / {nextXp.toLocaleString("id-ID")} XP
          </span>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Recent materials */}
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Materi Terbaru</h2>
            <Link
              href="/library"
              className="text-sm font-medium text-primary hover:underline"
            >
              Lihat semua
            </Link>
          </div>
          {mockMaterials.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              Belum ada materi. Upload materi pertamamu di Library.
            </p>
          ) : (
            <div className="space-y-2">
              {mockMaterials.slice(0, 3).map((m) => (
                <Link
                  key={m.id}
                  href={`/workspace?material=${m.id}`}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-muted"
                >
                  <span className="flex items-center gap-3">
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium uppercase text-primary">
                      {m.fileType}
                    </span>
                    {m.title}
                  </span>
                  <ArrowRight size={16} className="text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
          <Link
            href="/library"
            className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Upload size={16} />
            Upload materi baru
          </Link>
        </section>

        {/* Recent quizzes */}
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Quiz Terakhir</h2>
            <Link
              href="/workspace"
              className="text-sm font-medium text-primary hover:underline"
            >
              Buat quiz
            </Link>
          </div>
          <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Belum ada quiz yang dikerjakan. Buat quiz pertamamu dari workspace.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
