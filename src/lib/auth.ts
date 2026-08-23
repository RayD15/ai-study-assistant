import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { getDb, ensureSchema } from "@/lib/db";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret-ganti-di-production-32char!!",
);

export const SESSION_COOKIE = "asa_session";

export type SessionPayload = {
  userId: number;
  email: string;
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);

  // Secure flag hanya jika request datang lewat HTTPS (Vercel dsb.),
  // agar cookie tetap berfungsi saat diuji via http://localhost.
  const proto = (await headers()).get("x-forwarded-proto") ?? "http";
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: proto === "https",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (
      typeof payload.userId !== "number" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }
    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}

/** Ambil user lengkap dari session aktif (untuk API routes). */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  await ensureSchema();

  const db = getDb();
  const result = await db.execute({
    sql: "SELECT id, name, username, email, xp, level, streak, created_at FROM users WHERE id = ?",
    args: [session.userId],
  });

  const row = result.rows[0];
  if (!row) return null;

  // libsql mengembalikan Row dengan akses indeks; rapikan jadi plain object.
  return {
    id: Number(row.id),
    name: String(row.name),
    username: row.username === null || row.username === undefined ? null : String(row.username),
    email: String(row.email),
    xp: Number(row.xp),
    level: Number(row.level),
    streak: Number(row.streak),
    created_at: String(row.created_at),
  };
}
