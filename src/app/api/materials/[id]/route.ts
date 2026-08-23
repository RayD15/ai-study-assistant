import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, ensureSchema } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  await ensureSchema();

  const { id } = await params;
  const db = getDb();
  // Authorization: hanya materi milik user ini yang boleh dihapus
  const result = await db.execute({
    sql: "DELETE FROM materials WHERE id = ? AND user_id = ?",
    args: [Number(id), user.id],
  });

  if (Number(result.rowsAffected) === 0) {
    return NextResponse.json({ error: "Materi tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
