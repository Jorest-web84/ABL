import { z } from "zod";

const shortText = (label: string, max = 240) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);

const explanation = z.string().trim().min(1).max(500);

export const activityTypeSchema = z.enum([
  "multiple_choice",
  "true_false",
  "flashcards",
  "matching",
  "ordering",
]);

export type ActivityType = z.infer<typeof activityTypeSchema>;

const baseActivitySchema = z.object({
  type: activityTypeSchema,
  title: shortText("Title", 120),
  instructions: shortText("Instructions", 300),
});

export const multipleChoiceQuestionSchema = z.object({
  question: shortText("Question", 500),
  options: z.array(shortText("Option", 160)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation,
});

export const multipleChoiceActivitySchema = baseActivitySchema.extend({
  type: z.literal("multiple_choice"),
  questions: z.array(multipleChoiceQuestionSchema).min(1).max(20),
});

export const trueFalseQuestionSchema = z.object({
  statement: shortText("Statement", 500),
  answer: z.boolean(),
  explanation,
});

export const trueFalseActivitySchema = baseActivitySchema.extend({
  type: z.literal("true_false"),
  questions: z.array(trueFalseQuestionSchema).min(1).max(20),
});

export const flashcardSchema = z.object({
  front: shortText("Front", 240),
  back: shortText("Back", 500),
});

export const flashcardsActivitySchema = baseActivitySchema.extend({
  type: z.literal("flashcards"),
  cards: z.array(flashcardSchema).min(2).max(40),
});

export const matchingPairSchema = z.object({
  left: shortText("Left item", 180),
  right: shortText("Right item", 300),
});

export const matchingActivitySchema = baseActivitySchema.extend({
  type: z.literal("matching"),
  pairs: z.array(matchingPairSchema).min(2).max(20),
});

export const orderingActivitySchema = baseActivitySchema.extend({
  type: z.literal("ordering"),
  items: z.array(shortText("Item", 240)).min(2).max(20),
});

export const activitySchema = z.discriminatedUnion("type", [
  multipleChoiceActivitySchema,
  trueFalseActivitySchema,
  flashcardsActivitySchema,
  matchingActivitySchema,
  orderingActivitySchema,
]);

export type Activity = z.infer<typeof activitySchema>;
export type MultipleChoiceActivity = z.infer<typeof multipleChoiceActivitySchema>;
export type TrueFalseActivity = z.infer<typeof trueFalseActivitySchema>;
export type FlashcardsActivity = z.infer<typeof flashcardsActivitySchema>;
export type MatchingActivity = z.infer<typeof matchingActivitySchema>;
export type OrderingActivity = z.infer<typeof orderingActivitySchema>;

export const generateRequestSchema = z.object({
  type: activityTypeSchema,
  prompt: z.string().trim().min(1).max(8_000),
  currentActivity: activitySchema.nullable().default(null),
  refinement: z.string().trim().max(2_000).optional(),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
