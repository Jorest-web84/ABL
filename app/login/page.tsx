import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return <main className="auth-shell"><div className="auth-card"><span className="eyebrow">ABL</span><h1>Welcome back</h1><p>Sign in to build and manage your classroom activities.</p><Suspense fallback={<p>Loading sign in...</p>}><LoginForm /></Suspense></div></main>;
}
