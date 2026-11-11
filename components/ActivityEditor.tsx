"use client";

import { useEffect, useState } from "react";
import { activitySchema, type Activity } from "@/types/activity";

export function ActivityEditor({ activity, onChange }: { activity: Activity; onChange: (activity: Activity) => void }) {
  const [title, setTitle] = useState(activity.title);
  const [instructions, setInstructions] = useState(activity.instructions);
  const [content, setContent] = useState(JSON.stringify(activity, null, 2));
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(activity.title); setInstructions(activity.instructions); setContent(JSON.stringify(activity, null, 2));
  }, [activity]);

  function applyChanges() {
    try {
      const parsed = activitySchema.parse({ ...JSON.parse(content), title, instructions });
      onChange(parsed); setError("");
    } catch (caught) {
      setError(caught instanceof Error ? "Please check the activity content and required fields." : "Invalid activity content.");
    }
  }

  return <section className="editor-card">
    <div className="saved-heading"><h2>Direct editor</h2><span>{activity.type.replace("_", " ")}</span></div>
    <label htmlFor="edit-title">Title</label><input id="edit-title" value={title} onChange={(event) => setTitle(event.target.value)} />
    <label htmlFor="edit-instructions">Instructions</label><input id="edit-instructions" value={instructions} onChange={(event) => setInstructions(event.target.value)} />
    <label htmlFor="edit-content">Activity content</label><textarea id="edit-content" rows={12} value={content} onChange={(event) => setContent(event.target.value)} />
    <p className="helper-text">You can change text, add or remove items, and reorder arrays. Keep the JSON structure valid for this activity type.</p>
    <button className="generate-button" onClick={applyChanges}>Apply edits</button>
    {error && <p className="error-message">{error}</p>}
  </section>;
}
