import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, ensureSchema } from "@/lib/db";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  try {
    await ensureSchema();

    const db = getDb();
    const body = (await req.json()) as {
      name?: string;
      username?: string;
    };

    const name = body.name?.trim() ?? "";
    let username = body.username?.trim().toLowerCase() ?? "";

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "Nama minimal 2 karakter." },
        { status: 400 },
      );
    }

    // Validasi username: boleh kosong (pakai default), kalau diisi harus unik & valid
    if (username) {
      if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        return NextResponse.json(
          { error: "Username: 3-20 karakter, huruf kecil/angka/underscore." },
          { status: 400 },
        );
      }
      const taken = await db.execute({
        sql: "SELECT id FROM users WHERE username = ? AND id != ?",
        args: [username, user.id],
      });
      if (taken.rows.length > 0) {
        return NextResponse.json({ error: "Username sudah dipakai." }, { status: 409 });
      }
    } else {
      username = user.username ?? "";
    }

    await db.execute({
      sql: "UPDATE users SET name = ?, username = ?, updated_at = datetime('now') WHERE id = ?",
      args: [name, username || null, user.id],
    });

    return NextResponse.json({ ok: true, user: { ...user, name, username } });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 },
    );
  }
}
