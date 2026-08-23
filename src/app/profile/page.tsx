import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserBadges } from "@/lib/xp";
import ProfileClient from "./profile-client";
export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const badges = await getUserBadges(user.id);
  return <ProfileClient user={user} badges={badges} />;
}
