"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FileText,
  Folder,
  FolderOpen,
  Loader2,
  Search,
  Trash2,
  Upload,
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

export default function LibraryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form paste teks
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteContent, setPasteContent] = useState("");

  async function loadMaterials() {
    setLoading(true);
    try {
      const res = await fetch("/api/materials");
      const data = await res.json();
      setMaterials(data.materials ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMaterials();
  }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/materials", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal mengunggah materi.");
      setShowUpload(false);
      await loadMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handlePasteSubmit() {
    if (!pasteTitle.trim() || !pasteContent.trim()) return;
    setUploading(true);
    setError(null);
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: pasteTitle, content: pasteContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan materi.");
      setPasteTitle("");
      setPasteContent("");
      setShowUpload(false);
      await loadMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus materi ini?")) return;
    await fetch(`/api/materials/${id}`, { method: "DELETE" });
    await loadMaterials();
  }

  // Kelompokkan berdasarkan subject (atau "Umum")
  const filtered = materials.filter((m) =>
    m.title.toLowerCase().includes(query.toLowerCase()),
  );
  const grouped = filtered.reduce<Record<string, Material[]>>((acc, m) => {
    const key = m.subject ?? "Umum";
    (acc[key] ??= []).push(m);
    return acc;
  }, {});

  return (
    <AppShell>
      <PageHeader
        title="Study Library"
        subtitle="Kelola semua materi pelajaranmu di satu tempat."
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari materi..."
            className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          <Upload size={16} />
          Upload Materi
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" /> Memuat materi...
        </div>
      ) : materials.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <Folder size={36} className="mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Belum ada materi. Upload PDF/TXT atau tempel teks pelajaranmu.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([subject, items]) => (
            <section key={subject} className="rounded-xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 font-semibold">
                <FolderOpen size={18} className="text-primary" />
                {subject}
                <span className="text-sm font-normal text-muted-foreground">
                  ({items.length})
                </span>
              </h2>
              <div className="mt-4 space-y-2">
                {items.map((m) => (
                  <div
                    key={m.id}
                    className="group flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-muted"
                  >
                    <Link
                      href={`/workspace?material=${m.id}`}
                      className="flex min-w-0 items-center gap-3"
                    >
                      <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium uppercase text-primary">
                        {m.fileType}
                      </span>
                      <span className="truncate font-medium">{m.title}</span>
                      <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                        {m.createdAt.split(" ")[0]}
                      </span>
                    </Link>
                    <Trash2
                      size={15}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleDelete(m.id)}
                      onKeyDown={(e) => e.key === "Enter" && handleDelete(m.id)}
                      aria-label={`Hapus ${m.title}`}
                      className="shrink-0 cursor-pointer text-muted-foreground opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}

          {Object.keys(grouped).length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Tidak ada materi yang cocok dengan pencarian.
            </p>
          )}
        </div>
      )}

      {/* Modal upload */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !uploading && setShowUpload(false)}
          />
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Tambah Materi</h2>
              <button
                onClick={() => setShowUpload(false)}
                disabled={uploading}
                aria-label="Tutup"
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border px-6 py-8 text-center transition-colors hover:border-primary">
              {uploading ? (
                <>
                  <Loader2 size={24} className="animate-spin text-primary" />
                  <p className="mt-2 text-sm text-muted-foreground">Memproses file...</p>
                </>
              ) : (
                <>
                  <Upload size={24} className="text-primary" />
                  <p className="mt-2 text-sm font-medium">Klik untuk pilih file</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PDF atau TXT, maksimal 10 MB
                  </p>
                </>
              )}
              <input
                type="file"
                accept=".pdf,.txt"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              atau tempel teks
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-3">
              <input
                value={pasteTitle}
                onChange={(e) => setPasteTitle(e.target.value)}
                placeholder="Judul materi, misal: Trigonometri Dasar"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="Tempel isi materinya di sini..."
                rows={5}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <button
                onClick={handlePasteSubmit}
                disabled={uploading || !pasteTitle.trim() || !pasteContent.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <FileText size={15} />
                )}
                Simpan Materi (+20 XP)
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
