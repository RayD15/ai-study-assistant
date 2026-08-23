import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb, ensureSchema } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await ensureSchema();

    const body = (await req.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    // Validasi input
    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "Nama minimal 2 karakter." },
        { status: 400 },
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Format email tidak valid." },
        { status: 400 },
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter." },
        { status: 400 },
      );
    }

    const db = getDb();

    const existing = await db.execute({
      sql: "SELECT id FROM users WHERE email = ?",
      args: [email],
    });
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Gunakan email lain atau login." },
        { status: 409 },
      );
    }

    const username =
      email.split("@")[0] + "_" + Math.random().toString(36).slice(2, 6);
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.execute({
      sql: "INSERT INTO users (name, username, email, password_hash) VALUES (?, ?, ?, ?)",
      args: [name, username, email, passwordHash],
    });

    const userId = Number(result.lastInsertRowid);
    await createSession({ userId, email });

    return NextResponse.json(
      {
        user: { id: userId, name, username, email, xp: 0, level: 1, streak: 0 },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Coba lagi." },
      { status: 500 },
    );
  }
}
