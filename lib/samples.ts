import type { Activity, ActivityType } from "@/types/activity";

export function sampleActivity(type: ActivityType): Activity {
  const base = { title: "Introduction to photosynthesis", instructions: "Choose the best answer." };
  switch (type) {
    case "multiple_choice":
      return { ...base, type, questions: [{ question: "What do plants use to make food?", options: ["Sunlight", "Sound", "Plastic", "Salt"], correctIndex: 0, explanation: "Plants use light energy during photosynthesis." }] };
    case "true_false":
      return { ...base, type, questions: [{ statement: "Plants release oxygen during photosynthesis.", answer: true, explanation: "Oxygen is released as a by-product." }] };
    case "flashcards":
      return { ...base, type, instructions: "Tap a card to reveal the answer.", cards: [{ front: "Photosynthesis", back: "The process plants use to make food from light." }, { front: "Chlorophyll", back: "The green pigment that absorbs light." }] };
    case "matching":
      return { ...base, type, instructions: "Match each term to its partner.", pairs: [{ left: "Chlorophyll", right: "Absorbs light" }, { left: "Roots", right: "Absorb water" }] };
    case "ordering":
      return { ...base, type, instructions: "Put the steps in the correct order.", items: ["Light is absorbed", "Water is split", "Sugar is produced"] };
  }
}
