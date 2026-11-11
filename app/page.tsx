"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function HomePage() {
  const [confirmation, setConfirmation] = useState<"checking" | "confirmed" | "none" | "error">("none");

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) return;
    setConfirmation("checking");
    createSupabaseBrowserClient().auth.exchangeCodeForSession(code)
      .then(({ error }) => setConfirmation(error ? "error" : "confirmed"));
  }, []);

  if (confirmation === "checking" || confirmation === "confirmed" || confirmation === "error") {
    return <main className="auth-shell"><div className="auth-card confirmation-card">
      <span className="eyebrow">ABL</span>
      <h1>{confirmation === "checking" ? "Confirming your email..." : confirmation === "error" ? "Confirmation link expired" : "Email confirmed"}</h1>
      <p>{confirmation === "checking" ? "Please wait a moment." : confirmation === "error" ? "Please request a new confirmation email and try again." : "Your teacher account is ready. You can now sign in."}</p>
      <Link className="generate-button link-button" href="/login">Go to login</Link>
    </div></main>;
  }

  return <main className="landing-shell">
    <span className="eyebrow">ABL</span>
    <h1>AI Learning Builder</h1>
    <p>Create clear, engaging classroom activities in minutes.</p>
    <div className="landing-actions"><Link className="generate-button link-button" href="/login">Sign in</Link><Link className="secondary-button link-button" href="/login">Create an account</Link></div>
  </main>;
}
