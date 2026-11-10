import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { activitySchema, generateRequestSchema, type Activity } from "@/types/activity";
import { sampleActivity } from "@/lib/samples";
import { validateActivityContent } from "@/lib/validator";

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

async function generateWithClaude(request: ReturnType<typeof generateRequestSchema.parse>, correction?: string) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const instruction = correction ? `Previous output failed validation: ${correction}. Return a corrected complete JSON object.` : "Return only one complete JSON object. No markdown.";
  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
    max_tokens: 8_000,
    system: `You create classroom activities. The requested type is ${request.type}. Use this JSON shape exactly: ${activitySchema.toString()}. ${instruction}`,
    messages: [{ role: "user", content: `Teacher request: ${request.prompt}\nCurrent activity: ${JSON.stringify(request.currentActivity)}` }],
  });
  const text = message.content.find((block) => block.type === "text")?.text ?? "";
  return JSON.parse(text) as unknown;
}

export async function POST(httpRequest: Request) {
  try {
    const body = generateRequestSchema.safeParse(await httpRequest.json());
    if (!body.success) return jsonResponse({ error: "Please provide a valid activity type and request." }, 400);
    const request = body.data;
    let lastError = "";

    for (let attempt = 0; attempt < 2; attempt += 1) {
      let raw: unknown;
      try {
        raw = process.env.USE_FAKE_MODE === "true" ? sampleActivity(request.type) : await generateWithClaude(request, lastError);
      } catch {
        lastError = "The generator returned invalid JSON.";
        continue;
      }
      const parsed = activitySchema.safeParse(raw);
      if (!parsed.success) { lastError = "The activity did not match its required structure."; continue; }
      const contentErrors = validateActivityContent(parsed.data);
      if (contentErrors.length === 0) return jsonResponse({ activity: parsed.data, fakeMode: process.env.USE_FAKE_MODE === "true" });
      lastError = contentErrors.join(" ");
    }
    return jsonResponse({ error: "We could not create a valid activity yet. Your previous version was kept.", details: lastError }, 422);
  } catch {
    return jsonResponse({ error: "Something went wrong while creating the activity." }, 500);
  }
}
