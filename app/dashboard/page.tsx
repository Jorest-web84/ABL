"use client";

import { FormEvent, useState } from "react";
import { ActivityRenderer } from "@/components/ActivityRenderer";
import { activityTypeSchema, type Activity, type ActivityType } from "@/types/activity";

const labels: Record<ActivityType, string> = {
  multiple_choice: "Multiple choice",
  true_false: "True or false",
  flashcards: "Flashcards",
  matching: "Matching pairs",
  ordering: "Put in order",
};

export default function DashboardPage() {
  const [type, setType] = useState<ActivityType>("multiple_choice");
  const [prompt, setPrompt] = useState("Grade 7 photosynthesis, 5 questions, mostly easy");
  const [activity, setActivity] = useState<Activity | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function generate(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, prompt, currentActivity: activity }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Generation failed");
      setActivity(result.activity);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header"><div><span className="eyebrow">ABL · Teacher workspace</span><h1>Build an activity</h1></div><span className="mode-pill">Fake mode</span></header>
      <div className="workspace-grid">
        <form className="builder-card" onSubmit={generate}>
          <label htmlFor="activity-type">1. Choose a type</label>
          <div className="type-grid">
            {activityTypeSchema.options.map((option) => <button type="button" className={`type-button ${type === option ? "type-active" : ""}`} key={option} onClick={() => setType(option)}>{labels[option]}</button>)}
          </div>
          <label htmlFor="prompt">2. Describe what you want</label>
          <textarea id="prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Example: Grade 7 photosynthesis, 10 questions" rows={6} />
          <button className="generate-button" disabled={busy || !prompt.trim()}>{busy ? "Creating activity..." : activity ? "Generate new version" : "Generate activity"}</button>
          {error && <p className="error-message" role="alert">{error}</p>}
          <p className="helper-text">Your request is sent to the server. Generated content is validated before it appears here.</p>
        </form>
        <section className="preview-area"><div className="preview-label">Live preview</div>{activity ? <ActivityRenderer activity={activity} /> : <div className="empty-preview"><span>✦</span><h2>Your activity will appear here</h2><p>Choose a type, describe your lesson, and generate a preview.</p></div>}</section>
      </div>
    </main>
  );
}
