"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const supabase = createSupabaseBrowserClient();
    const result = mode === "login" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    if (result.error) setMessage(result.error.message);
    else if (mode === "signup") setMessage("Check your email to confirm your account.");
    else router.push(searchParams.get("next") || "/dashboard");
    setBusy(false);
  }

  return <form className="auth-form" onSubmit={submit}>
    <label htmlFor="email">Email</label><input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
    <label htmlFor="password">Password</label><input id="password" type="password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} />
    <button className="generate-button" disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}</button>
    {message && <p className="auth-message" role="status">{message}</p>}
    <button type="button" className="switch-auth" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>{mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}</button>
  </form>;
}
