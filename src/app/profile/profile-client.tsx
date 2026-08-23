"use client";

import { useState } from "react";
import { Check, Flame, Loader2, Mail, Star, Trophy } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";

type User = {
  id: number;
  name: string;
  username: string | null;
  email: string;
  xp: number;
  level: number;
  streak: number;
};

type Badge = { name: string; description: string; earned: boolean };

export default function ProfileClient({
  user,
  badges,
}: {
  user: User;
  badges: Badge[];
}) {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan.");
        return;
      }
      setSaved(true);
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <PageHeader title="Profil" subtitle="Kelola akun dan lihat pencapaianmu." />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Card profil */}
        <section className="rounded-xl border border-border bg-card p-6 text-center lg:col-span-1">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
            {user.name[0]?.toUpperCase()}
          </div>
          <h2 className="mt-4 text-lg font-semibold">{name}</h2>
          <p className="text-sm text-muted-foreground">@{username || user.email.split("@")[0]}</p>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <Mail size={14} />
            {user.email}
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border pt-6">
            <div>
              <Star size={18} className="mx-auto text-yellow-500" />
              <p className="mt-1 font-bold">{user.xp.toLocaleString("id-ID")}</p>
              <p className="text-xs text-muted-foreground">XP</p>
            </div>
            <div>
              <Trophy size={18} className="mx-auto text-primary" />
              <p className="mt-1 font-bold">{user.level}</p>
              <p className="text-xs text-muted-foreground">Level</p>
            </div>
            <div>
              <Flame size={18} className="mx-auto text-orange-500" />
              <p className="mt-1 font-bold">{user.streak}</p>
              <p className="text-xs text-muted-foreground">Streak</p>
            </div>
          </div>
        </section>

        {/* Badge & statistik */}
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold">Badge</h2>
            <p className="text-sm text-muted-foreground">
              {badges.filter((b) => b.earned).length} dari {badges.length} badge didapat
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {badges.map((b) => (
                <div
                  key={b.name}
                  className={`rounded-lg border p-4 ${
                    b.earned
                      ? "border-yellow-500/40 bg-yellow-500/5"
                      : "border-border opacity-50"
                  }`}
                >
                  <Trophy
                    size={20}
                    className={b.earned ? "text-yellow-500" : "text-muted-foreground"}
                  />
                  <p className="mt-2 text-sm font-semibold">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold">Pengaturan Akun</h2>
            <form className="mt-4 space-y-4" onSubmit={handleSave}>
              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
              {saved && (
                <p className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
                  <Check size={15} /> Perubahan tersimpan.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="profile-name" className="text-sm font-medium">
                    Nama
                  </label>
                  <input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label htmlFor="profile-username" className="text-sm font-medium">
                    Username
                  </label>
                  <input
                    id="profile-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username unik"
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Simpan Perubahan
              </button>
            </form>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
