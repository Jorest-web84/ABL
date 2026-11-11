"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ActivityRenderer } from "@/components/ActivityRenderer";
import { activityTypeSchema, type Activity, type ActivityType } from "@/types/activity";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ActivityEditor } from "@/components/ActivityEditor";

const labels: Record<ActivityType, string> = {
  multiple_choice: "Multiple choice",
  true_false: "True or false",
  flashcards: "Flashcards",
  matching: "Matching pairs",
  ordering: "Put in order",
};

export default function DashboardPage() {
  const router = useRouter();
  const [type, setType] = useState<ActivityType>("multiple_choice");
  const [prompt, setPrompt] = useState("Grade 7 photosynthesis, 5 questions, mostly easy");
  const [activity, setActivity] = useState<Activity | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedActivities, setSavedActivities] = useState<Array<{ id: string; title: string; type: ActivityType; is_published: boolean }>>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [refinement, setRefinement] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.from("activities").select("id, title, type, is_published").order("updated_at", { ascending: false }).then(({ data }) => {
      if (data) setSavedActivities(data as Array<{ id: string; title: string; type: ActivityType; is_published: boolean }>);
    });
  }, []);

  async function generate(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, prompt, currentActivity: activity }) });
      const result = await response.json();
      if (!response.ok) throw new Error([result.error, result.details].filter(Boolean).join(" ") || "Generation failed");
      setActivity(result.activity);
      setSaveMessage("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  async function refine() {
    if (!activity || !refinement.trim()) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: activity.type, prompt, refinement, currentActivity: activity }) });
      const result = await response.json();
      if (!response.ok) throw new Error([result.error, result.details].filter(Boolean).join(" ") || "Refinement failed");
      setActivity(result.activity); setRefinement(""); setSaveMessage("Refinement ready to save.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Refinement failed"); }
    finally { setBusy(false); }
  }

  async function saveActivity() {
    if (!activity) return;
    setSaveMessage("");
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaveMessage("Your session has expired. Please sign in again."); return; }
    const query = selectedActivityId
      ? supabase.from("activities").update({ title: activity.title, type: activity.type, content: activity, prompt }).eq("id", selectedActivityId).select("id, title, type").single()
      : supabase.from("activities").insert({ teacher_id: user.id, title: activity.title, type: activity.type, content: activity, prompt }).select("id, title, type").single();
    const { data, error: saveError } = await query;
    if (saveError) setSaveMessage(saveError.message);
    else if (data) { const saved = data as { id: string; title: string; type: ActivityType; is_published: boolean }; setSavedActivities(selectedActivityId ? savedActivities.map((item) => item.id === saved.id ? saved : item) : [saved, ...savedActivities]); setSelectedActivityId(saved.id); setSaveMessage("Activity saved."); }
  }

  async function loadActivity(id: string) {
    setLoadingSaved(true);
    setError("");
    const supabase = createSupabaseBrowserClient();
    const { data, error: loadError } = await supabase.from("activities").select("content, type").eq("id", id).single();
    if (loadError) setError(loadError.message);
    else if (data?.content) { setActivity(data.content as Activity); setSelectedActivityId(id); }
    setLoadingSaved(false);
  }

  async function togglePublished(id: string, published: boolean) {
    const supabase = createSupabaseBrowserClient();
    const { error: publishError } = await supabase.from("activities").update({ is_published: !published }).eq("id", id);
    if (publishError) setSaveMessage(publishError.message);
    else { setSavedActivities(savedActivities.map((item) => item.id === id ? { ...item, is_published: !published } : item)); setSaveMessage(!published ? "Activity published." : "Activity unpublished."); }
  }

  async function deleteActivity(id: string) {
    if (!window.confirm("Delete this activity permanently?")) return;
    const supabase = createSupabaseBrowserClient();
    const { error: deleteError } = await supabase.from("activities").delete().eq("id", id);
    if (deleteError) setSaveMessage(deleteError.message);
    else { setSavedActivities(savedActivities.filter((item) => item.id !== id)); if (selectedActivityId === id) { setSelectedActivityId(null); setActivity(null); } setSaveMessage("Activity deleted."); }
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header"><div><span className="eyebrow">ABL · Teacher workspace</span><h1>Build an activity</h1></div><div className="header-actions"><span className="mode-pill">{process.env.NEXT_PUBLIC_FAKE_MODE === "true" ? "Fake mode" : "Live AI"}</span><button className="signout-button" onClick={async () => { await createSupabaseBrowserClient().auth.signOut(); router.push("/login"); }}>Sign out</button></div></header>
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
        <section className="preview-area"><div className="preview-label">Live preview</div>{activity ? <><ActivityRenderer activity={activity} /><div className="preview-actions"><button className="generate-button" onClick={saveActivity}>Save activity</button>{saveMessage && <span className="save-message">{saveMessage}</span>}</div><div className="refine-card"><label htmlFor="refinement">Refine with AI</label><div className="refine-row"><input id="refinement" value={refinement} onChange={(event) => setRefinement(event.target.value)} placeholder="Make question 3 harder..." /><button className="secondary-button" onClick={refine} disabled={busy || !refinement.trim()}>Refine</button></div></div><ActivityEditor activity={activity} onChange={(updated) => { setActivity(updated); setSaveMessage("Edits ready to save."); }} /></> : <div className="empty-preview"><span>✦</span><h2>Your activity will appear here</h2><p>Choose a type, describe your lesson, and generate a preview.</p></div>}
          <div className="saved-card"><div className="saved-heading"><h2>Saved activities</h2><span>{savedActivities.length}</span></div>{savedActivities.length === 0 ? <p className="saved-empty">Your saved activities will appear here.</p> : <div className="saved-list">{savedActivities.map((saved) => <div className="saved-row" key={saved.id}><button className="saved-open" onClick={() => loadActivity(saved.id)} disabled={loadingSaved}><strong>{saved.title}</strong><small>{labels[saved.type]}</small></button><div className="saved-controls"><button className="publish-button" onClick={() => togglePublished(saved.id, saved.is_published)}>{saved.is_published ? "Unpublish" : "Publish"}</button>{saved.is_published && <a href={`/a/${saved.id}`} target="_blank" rel="noreferrer">Open link</a>}<button className="delete-button" onClick={() => deleteActivity(saved.id)}>Delete</button></div></div>)}</div>}</div>
        </section>
      </div>
    </main>
  );
}
