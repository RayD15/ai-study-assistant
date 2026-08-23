import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb, ensureSchema } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await ensureSchema();

    const body = (await req.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi." },
        { status: 400 },
      );
    }

    const db = getDb();
    const result = await db.execute({
      sql: "SELECT id, name, username, email, password_hash, xp, level, streak FROM users WHERE email = ?",
      args: [email],
    });

    const user = result.rows[0];

    // Pesan error sama untuk email salah / password salah (mencegah user enumeration)
    if (
      !user ||
      !(await bcrypt.compare(password, String(user.password_hash)))
    ) {
      return NextResponse.json(
        { error: "Email atau password salah." },
        { status: 401 },
      );
    }

    await createSession({ userId: Number(user.id), email: String(user.email) });

    return NextResponse.json({
      user: {
        id: Number(user.id),
        name: String(user.name),
        username: user.username ? String(user.username) : null,
        email: String(user.email),
        xp: Number(user.xp),
        level: Number(user.level),
        streak: Number(user.streak),
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Coba lagi." },
      { status: 500 },
    );
  }
}

// Logout
export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
