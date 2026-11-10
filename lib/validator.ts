import type { Activity } from "@/types/activity";

export function validateActivityContent(activity: Activity): string[] {
  const errors: string[] = [];
  const unique = (values: string[], label: string) => {
    const normalized = values.map((value) => value.trim().toLowerCase());
    if (new Set(normalized).size !== normalized.length) errors.push(`${label} contains duplicates.`);
  };

  if (activity.type === "multiple_choice") {
    activity.questions.forEach((question, index) => {
      unique(question.options, `Question ${index + 1} options`);
      if (question.options[question.correctIndex] === undefined) errors.push(`Question ${index + 1} has no correct answer.`);
    });
  }
  if (activity.type === "flashcards") unique(activity.cards.map((card) => card.front), "Flashcard fronts");
  if (activity.type === "matching") {
    unique(activity.pairs.map((pair) => pair.left), "Matching terms");
    unique(activity.pairs.map((pair) => pair.right), "Matching answers");
  }
  if (activity.type === "ordering") unique(activity.items, "Ordering items");
  return errors;
}
