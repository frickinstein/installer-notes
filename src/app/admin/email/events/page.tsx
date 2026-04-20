import { redirect } from "next/navigation";

export default function LegacyEventsPage() {
  redirect("/admin/email/analytics");
}
