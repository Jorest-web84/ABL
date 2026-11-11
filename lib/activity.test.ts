import { describe, expect, it } from "vitest";
import { activitySchema } from "@/types/activity";
import { validateActivityContent } from "@/lib/validator";

const base = { title: "Test activity", instructions: "Complete the activity." };

describe("activity schemas", () => {
  it.each([
    { type: "multiple_choice", questions: [{ question: "Q?", options: ["A", "B", "C", "D"], correctIndex: 0, explanation: "Because A." }] },
    { type: "true_false", questions: [{ statement: "The statement.", answer: true, explanation: "Because it is true." }] },
    { type: "flashcards", cards: [{ front: "Term", back: "Definition" }, { front: "Term 2", back: "Definition 2" }] },
    { type: "matching", pairs: [{ left: "Term", right: "Definition" }, { left: "Term 2", right: "Definition 2" }] },
    { type: "ordering", items: ["First", "Second"] },
  ])("accepts $type", (content) => {
    expect(activitySchema.safeParse({ ...base, ...content }).success).toBe(true);
  });

  it("rejects multiple choice with fewer than four options", () => {
    const result = activitySchema.safeParse({ ...base, type: "multiple_choice", questions: [{ question: "Q?", options: ["A", "B"], correctIndex: 0, explanation: "Reason" }] });
    expect(result.success).toBe(false);
  });
});

describe("activity content checks", () => {
  it("finds duplicate multiple choice options", () => {
    const activity = activitySchema.parse({ ...base, type: "multiple_choice", questions: [{ question: "Q?", options: ["A", "A", "C", "D"], correctIndex: 0, explanation: "Reason" }] });
    expect(validateActivityContent(activity)).toContain("Question 1 options contains duplicates.");
  });

  it("accepts valid ordering content", () => {
    const activity = activitySchema.parse({ ...base, type: "ordering", items: ["First", "Second"] });
    expect(validateActivityContent(activity)).toEqual([]);
  });
});
