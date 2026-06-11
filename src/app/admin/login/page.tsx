import "@/app/admin/admin.css";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";
import { LoginForm } from "@/components/admin/login-form";

export const metadata = { title: "Gobble Admin — Sign in" };

export default async function AdminLoginPage() {
  // Already signed in as an admin? Straight to the panel.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: adminRow } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (adminRow) {
      redirect("/admin");
    }
  }

  return (
    <div
      className="ad-root"
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
    >
      <div className="ad-card" style={{ width: "100%", maxWidth: 380 }}>
        <div className="ad-brand" style={{ padding: "4px 0 14px" }}>
          <span className="ad-brand-mark">
            <Icon name="pinOutline" size={17} color="#fff" strokeWidth={2.2} />
          </span>
          <span className="ad-brand-text">Gobble Admin</span>
        </div>
        <p className="ad-sub" style={{ marginBottom: 14 }}>
          Sign in with your admin account to manage Gobble Maps.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
