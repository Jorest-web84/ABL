"use client";

import { useState } from "react";
import type { Activity } from "@/types/activity";

export function ActivityRenderer({ activity }: { activity: Activity }) {
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  return (
    <article className="preview-card">
      <div className="preview-heading">
        <div>
          <span className="preview-type">{activity.type.replace("_", " ")}</span>
          <h2>{activity.title}</h2>
          <p>{activity.instructions}</p>
        </div>
      </div>

      {activity.type === "multiple_choice" && activity.questions.map((question, index) => (
        <section className="question-block" key={`${question.question}-${index}`}>
          <strong>{index + 1}. {question.question}</strong>
          <div className="option-list">
            {question.options.map((option, optionIndex) => (
              <button
                className={`option ${selected[index] === optionIndex ? "option-selected" : ""}`}
                key={option}
                onClick={() => setSelected({ ...selected, [index]: optionIndex })}
              >
                <span>{String.fromCharCode(65 + optionIndex)}</span>{option}
              </button>
            ))}
          </div>
        </section>
      ))}

      {activity.type === "true_false" && activity.questions.map((question, index) => (
        <section className="question-block" key={`${question.statement}-${index}`}>
          <strong>{index + 1}. {question.statement}</strong>
          <div className="option-list two-column">
            {[true, false].map((answer) => (
              <button className={`option ${selected[index] === Number(answer) ? "option-selected" : ""}`} key={String(answer)} onClick={() => setSelected({ ...selected, [index]: Number(answer) })}>
                {answer ? "True" : "False"}
              </button>
            ))}
          </div>
        </section>
      ))}

      {activity.type === "flashcards" && <div className="flashcard-grid">
        {activity.cards.map((card, index) => (
          <button className="flashcard" key={`${card.front}-${index}`} onClick={() => setFlipped({ ...flipped, [index]: !flipped[index] })}>
            <span className="flashcard-label">{flipped[index] ? "Answer" : "Term"}</span>
            <strong>{flipped[index] ? card.back : card.front}</strong>
            <small>Tap to flip</small>
          </button>
        ))}
      </div>}

      {activity.type === "matching" && <div className="matching-grid">
        {activity.pairs.map((pair, index) => <div className="match-row" key={`${pair.left}-${index}`}><span>{pair.left}</span><span>{pair.right}</span></div>)}
      </div>}

      {activity.type === "ordering" && <ol className="order-list">
        {activity.items.map((item) => <li key={item}>{item}</li>)}
      </ol>}
    </article>
  );
}
