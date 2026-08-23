# 📚 AI Study Assistant

Asisten belajar berbasis AI yang membantu pelajar memahami materi pelajaran — bukan sekadar chatbot. Upload materi (PDF atau tempel teks), lalu belajar lebih efektif dengan ringkasan otomatis, quiz interaktif, flashcard, dan penjelasan konsep.

## ✨ Fitur

- **Summary** — ringkasan materi otomatis dalam 3 mode panjang: singkat, normal, detail
- **Quiz** — soal latihan pilihan ganda & true/false yang dibuat AI dari materi, lengkap dengan pembahasan dan review jawaban
- **Flashcard** — kartu belajar auto-generated, bisa diacak dan ditandai *mastered*
- **Explain** — penjelasan konsep dengan level berbeda (SMP / SMA / pemula total)
- **Gamifikasi** — XP, level, dan streak untuk menjaga motivasi belajar
- **Autentikasi** — registrasi & login dengan JWT (cookie httpOnly), proteksi route via middleware
- **Upload Materi** — dukungan PDF (ekstraksi teks via `unpdf`) dan teks manual

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) + React 19 |
| Styling | Tailwind CSS v4 |
| AI | [Google Gemini API](https://ai.google.dev) (`@google/genai`) |
| Database | SQLite lokal / [Turso](https://turso.tech) cloud (`@libsql/client`) |
| Auth | `jose` (JWT) + `bcryptjs` |
| Ekstraksi PDF | `unpdf` |
| Icons | `lucide-react` |

## 🚀 Menjalankan Project

### 1. Clone & install dependencies

```bash
git clone https://github.com/RayD15/ai-study-assistant.git
cd ai-study-assistant
npm install
```

### 2. Setup environment variables

Buat file `.env.local` di root project:

```env
# Ambil gratis di https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key

# Secret untuk signing JWT session (min. 32 karakter acak)
AUTH_SECRET=ganti-dengan-string-acak-minimal-32-karakter

# (Opsional) Pakai Turso untuk production — jika kosong, pakai SQLite lokal di ./data/app.db
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# (Opsional) Lokasi file SQLite kustom
DB_PATH=
```

### 3. Jalankan development server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000), daftar akun, upload materi di halaman **Library**, lalu mulai belajar di **Workspace**.

## 📜 Scripts

| Command | Fungsi |
|---|---|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Build production |
| `npm run start` | Jalankan hasil build production |
| `npm run lint` | ESLint |

## 📁 Struktur Project

```
src/
├── app/
│   ├── api/            # Route handlers (auth, materials, quizzes, ai/*)
│   ├── dashboard/      # Ringkasan aktivitas & statistik belajar
│   ├── library/        # Upload & kelola materi
│   ├── workspace/      # Fitur AI utama (chat, summary, quiz, flashcard, explain)
│   ├── profile/        # Profil pengguna
│   └── login|register/ # Autentikasi
├── components/         # AppShell, theme provider, UI bits
├── lib/
│   ├── gemini.ts       # Integrasi Gemini + prompt engineering
│   ├── auth.ts         # Sesi JWT & helper getCurrentUser()
│   ├── db.ts           # Dual-mode DB client (Turso / SQLite lokal)
│   └── xp.ts           # Logika gamifikasi XP & level
└── middleware.ts       # Proteksi route (redirect login/dashboard)
```

## ☁️ Deploy ke Vercel

1. Push project ke GitHub
2. Import repo di [Vercel](https://vercel.com/new)
3. Set environment variables (`GEMINI_API_KEY`, `AUTH_SECRET`, dan opsional `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`)
4. Deploy

> ⚠️ Untuk production, selalu set `AUTH_SECRET` yang kuat dan gunakan Turso sebagai database (filesystem Vercel bersifat ephemeral, SQLite lokal tidak persisten).

## 📄 License

MIT
