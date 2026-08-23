import { getDb, ensureSchema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const LEVEL_THRESHOLDS: { level: number; name: string }[] = [
  { level: 20, name: "Master" },
  { level: 10, name: "Scholar" },
  { level: 5, name: "Learner" },
  { level: 1, name: "Beginner" },
];

export function levelName(level: number): string {
  for (const t of LEVEL_THRESHOLDS) {
    if (level >= t.level) return t.name;
  }
  return "Beginner";
}

/** XP yang dibutuhkan untuk naik DARI level tertentu. */
export function xpToNextLevel(level: number): number {
  return level * 400;
}

/**
 * Tambah XP + catat aktivitas, lalu proses level up berulang
 * (satu aktivitas bisa melompati lebih dari satu level).
 */
export async function awardXp(
  activityType: string,
  xpAmount: number,
  detail?: string,
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Tidak terautentikasi.");

  await ensureSchema();

  const db = getDb();

  let xp = user.xp + xpAmount;
  let level = user.level;
  const leveledUp: number[] = [];

  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level += 1;
    leveledUp.push(level);
  }

  await db.execute({
    sql: "UPDATE users SET xp = ?, level = ?, updated_at = datetime('now') WHERE id = ?",
    args: [xp, level, user.id],
  });

  await db.execute({
    sql: "INSERT INTO user_progress (user_id, activity_type, xp_amount, detail) VALUES (?, ?, ?, ?)",
    args: [user.id, activityType, xpAmount, detail ?? null],
  });

  // Badge otomatis sederhana
  if (activityType === "quiz_complete") {
    await grantBadge(user.id, "First Quiz");
    if (detail === "perfect") await grantBadge(user.id, "Quiz Master");
  }
  if (activityType === "material_upload") {
    const countResult = await db.execute({
      sql: "SELECT COUNT(*) AS c FROM materials WHERE user_id = ?",
      args: [user.id],
    });
    if (Number(countResult.rows[0]?.c ?? 0) >= 10) {
      await grantBadge(user.id, "Bookworm");
    }
  }
  if (user.streak >= 7) {
    await grantBadge(user.id, "7 Day Streak");
  }

  return {
    xp,
    level,
    leveledUp,
    levelName: levelName(level),
    earnedXp: xpAmount,
  };
}

async function grantBadge(userId: number, badgeName: string): Promise<void> {
  const db = getDb();
  const badge = await db.execute({
    sql: "SELECT id FROM badges WHERE name = ?",
    args: [badgeName],
  });
  const badgeId = badge.rows[0]?.id;
  if (badgeId === undefined) return;
  await db.execute({
    sql: "INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)",
    args: [userId, Number(badgeId)],
  });
}

/** Ambil status semua badge untuk user (untuk halaman profil). */
export async function getUserBadges(userId: number) {
  const db = getDb();
  await ensureSchema();

  const result = await db.execute({
    sql: `SELECT b.name, b.description, CASE WHEN ub.user_id IS NULL THEN 0 ELSE 1 END AS earned
          FROM badges b
          LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = ?
          ORDER BY b.id`,
    args: [userId],
  });

  return result.rows.map((row) => ({
    name: String(row.name),
    description: String(row.description),
    earned: Number(row.earned) === 1,
  }));
}
