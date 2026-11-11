"use client";

import { useEffect, useMemo, useState } from "react";
import type { Activity } from "@/types/activity";

export function StudentActivity({ activity }: { activity: Activity }) {
  const [answers, setAnswers] = useState<Record<number, number | boolean>>({});
  const [finished, setFinished] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [items, setItems] = useState(activity.type === "ordering" ? activity.items : []);
  const [matchingSelection, setMatchingSelection] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [matchingOptions, setMatchingOptions] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
  const [draggedOrderIndex, setDraggedOrderIndex] = useState<number | null>(null);
  const [draggedDefinition, setDraggedDefinition] = useState<string | null>(null);

  useEffect(() => {
    if (activity.type === "ordering") setItems([...activity.items].sort(() => Math.random() - 0.5));
    if (activity.type === "matching") setMatchingOptions([...activity.pairs.map((pair) => pair.right)].sort(() => Math.random() - 0.5));
  }, [activity]);

  const total = activity.type === "multiple_choice" ? activity.questions.length : activity.type === "true_false" ? activity.questions.length : activity.type === "matching" ? activity.pairs.length : activity.type === "ordering" ? activity.items.length : 0;
  const score = useMemo(() => {
    if (activity.type === "multiple_choice") return activity.questions.reduce((sum, item, index) => sum + (answers[index] === item.correctIndex ? 1 : 0), 0);
    if (activity.type === "true_false") return activity.questions.reduce((sum, item, index) => sum + (answers[index] === item.answer ? 1 : 0), 0);
    if (activity.type === "ordering") return items.reduce((sum, item, index) => sum + (item === activity.items[index] ? 1 : 0), 0);
    if (activity.type === "matching") return Object.keys(matchedPairs).length;
    return 0;
  }, [activity, answers, items]);

  if (finished) return <section className="student-card result-card"><span className="preview-type">Complete</span><h1>{reviewing ? "Review your answers" : "Nice work!"}</h1>{!reviewing && <><div className="score-number">{activity.type === "flashcards" ? "Done" : `${score} / ${total}`}</div><p>You have finished <strong>{activity.title}</strong>.</p><div className="result-actions"><button className="generate-button" onClick={() => setReviewing(true)}>Review answers</button><button className="secondary-button" onClick={() => { setFinished(false); setReviewing(false); setAnswers({}); setMatched([]); setMatchedPairs({}); }}>Try again</button></div></>}{reviewing && <><div className="answer-review">{activity.type === "multiple_choice" && activity.questions.map((question, index) => { const chosen = answers[index]; const isCorrect = chosen === question.correctIndex; return <div className={`review-item ${isCorrect ? "review-correct" : "review-wrong"}`} key={question.question}><strong>{index + 1}. {question.question}</strong><p>Your answer: <b>{chosen === undefined ? "No answer" : question.options[chosen as number]}</b></p>{!isCorrect && <><p>Correct answer: <b>{question.options[question.correctIndex]}</b></p><small>{question.explanation}</small></>}</div>; })}{activity.type === "true_false" && activity.questions.map((question, index) => { const chosen = answers[index]; const isCorrect = chosen === question.answer; return <div className={`review-item ${isCorrect ? "review-correct" : "review-wrong"}`} key={question.statement}><strong>{index + 1}. {question.statement}</strong><p>Your answer: <b>{chosen === undefined ? "No answer" : chosen ? "True" : "False"}</b></p>{!isCorrect && <><p>Correct answer: <b>{question.answer ? "True" : "False"}</b></p><small>{question.explanation}</small></>}</div>; })}{activity.type === "matching" && activity.pairs.map((pair) => <div className={`review-item ${matchedPairs[pair.left] === pair.right ? "review-correct" : "review-wrong"}`} key={pair.left}><strong>{pair.left}</strong><p>Your match: <b>{matchedPairs[pair.left] || "No match"}</b></p>{matchedPairs[pair.left] !== pair.right && <p>Correct match: <b>{pair.right}</b></p>}</div>)}{activity.type === "ordering" && <div className={`review-item ${score === total ? "review-correct" : "review-wrong"}`}><strong>Correct order</strong><p>Your order: {items.join(" → ")}</p>{score !== total && <p>Correct order: {activity.items.join(" → ")}</p>}</div>}</div><button className="secondary-button" onClick={() => setReviewing(false)}>Back to result</button></>}</section>;

  return <section className="student-card"><span className="preview-type">{activity.type.replace("_", " ")}</span><h1>{activity.title}</h1><p>{activity.instructions}</p>
    {activity.type === "multiple_choice" && activity.questions.map((question, index) => <div className="student-question" key={question.question}><strong>{index + 1}. {question.question}</strong><div className="option-list">{question.options.map((option, optionIndex) => <button className={`option ${answers[index] === optionIndex ? "option-selected" : ""}`} key={option} onClick={() => setAnswers({ ...answers, [index]: optionIndex })}>{option}</button>)}</div></div>)}
    {activity.type === "true_false" && activity.questions.map((question, index) => <div className="student-question" key={question.statement}><strong>{index + 1}. {question.statement}</strong><div className="option-list two-column"><button className={`option ${answers[index] === true ? "option-selected" : ""}`} onClick={() => setAnswers({ ...answers, [index]: true })}>True</button><button className={`option ${answers[index] === false ? "option-selected" : ""}`} onClick={() => setAnswers({ ...answers, [index]: false })}>False</button></div></div>)}
    {activity.type === "flashcards" && <div className="flashcard-grid">{activity.cards.map((card, index) => <button className={`flashcard ${flipped[index] ? "is-flipped" : ""}`} key={card.front} onClick={() => setFlipped({ ...flipped, [index]: !flipped[index] })}><span className="flashcard-label">{flipped[index] ? "Answer" : "Term"}</span><strong>{flipped[index] ? card.back : card.front}</strong><small>Tap to flip</small></button>)}</div>}
    {activity.type === "matching" && <><div className="matching-board">{activity.pairs.map((pair) => <div className="drop-row" key={pair.left}><div className={`match-choice ${matchedPairs[pair.left] ? "match-complete" : ""}`}>{pair.left}</div><div className="drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedDefinition) { setMatchedPairs({ ...matchedPairs, [pair.left]: draggedDefinition }); setDraggedDefinition(null); } }}>{matchedPairs[pair.left] || "Drop definition here"}</div></div>)}</div><div className="matching-options">{matchingOptions.map((definition) => <div draggable className="drag-option" key={definition} onDragStart={() => setDraggedDefinition(definition)}>{definition}</div>)}</div></>}
    {activity.type === "ordering" && <div className="order-list">{items.map((item, index) => <div draggable className="order-item" key={item} onDragStart={() => setDraggedOrderIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedOrderIndex === null || draggedOrderIndex === index) return; const next = [...items]; const [moved] = next.splice(draggedOrderIndex, 1); next.splice(index, 0, moved); setItems(next); setDraggedOrderIndex(null); }}>{index + 1}. {item}</div>)}</div>}
    <button className="generate-button student-submit" onClick={() => setFinished(true)}>{activity.type === "flashcards" || activity.type === "matching" ? "Finish activity" : "Check answers"}</button>
  </section>;
}
