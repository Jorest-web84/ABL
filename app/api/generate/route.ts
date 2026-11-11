import { NextResponse } from "next/server";
import { activitySchema, generateRequestSchema } from "@/types/activity";
import { sampleActivity } from "@/lib/samples";
import { validateActivityContent } from "@/lib/validator";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

async function generateWithGemini(request: ReturnType<typeof generateRequestSchema.parse>, correction?: string) {
  const instruction = correction ? `Previous output failed validation: ${correction}. Return a corrected complete JSON object.` : "Return only one complete JSON object. No markdown.";
  const shapes = {
    multiple_choice: '{"type":"multiple_choice","title":"...","instructions":"...","questions":[{"question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}]}',
    true_false: '{"type":"true_false","title":"...","instructions":"...","questions":[{"statement":"...","answer":true,"explanation":"..."}]}',
    flashcards: '{"type":"flashcards","title":"...","instructions":"...","cards":[{"front":"...","back":"..."}]}',
    matching: '{"type":"matching","title":"...","instructions":"...","pairs":[{"left":"...","right":"..."}]}',
    ordering: '{"type":"ordering","title":"...","instructions":"...","items":["first","second"]}',
  } as const;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
  const requestedModel = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const modelsToTry = [requestedModel, "gemini-2.5-flash-lite"].filter((model, index, models) => models.indexOf(model) === index);
  let response: Response | undefined;
  for (const model of modelsToTry) {
    const attempt = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: `You create classroom activities. The requested type is ${request.type}. Return JSON matching this exact shape: ${shapes[request.type]}. Use at least 2 items and no extra fields. ${instruction}` }] },
      contents: [{ role: "user", parts: [{ text: `Teacher request: ${request.prompt}\nRefinement request: ${request.refinement || "Create the first version."}\nCurrent activity: ${JSON.stringify(request.currentActivity)}` }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
    }),
    });
    response = attempt;
    if (attempt.ok || attempt.status !== 404) break;
  }
  if (!response) throw new Error("Gemini did not return a response.");
  if (!response.ok) throw new Error(`Gemini request failed with ${response.status}.`);
  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  if (!cleaned) throw new Error("Gemini returned an empty response.");
  return JSON.parse(cleaned) as unknown;
}

export async function POST(httpRequest: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonResponse({ error: "You must be signed in to generate an activity." }, 401);
    const body = generateRequestSchema.safeParse(await httpRequest.json());
    if (!body.success) return jsonResponse({ error: "Please provide a valid activity type and request." }, 400);
    const request = body.data;
    let lastError = "";

    for (let attempt = 0; attempt < 2; attempt += 1) {
      let raw: unknown;
      try {
        raw = process.env.USE_FAKE_MODE === "true" ? sampleActivity(request.type) : await generateWithGemini(request, lastError);
      } catch (caught) {
        lastError = caught instanceof Error ? caught.message : "The generator returned invalid JSON.";
        console.error("Activity generation failed:", lastError);
        continue;
      }
      const parsed = activitySchema.safeParse(raw);
      if (!parsed.success) { lastError = "The activity did not match its required structure."; continue; }
      const contentErrors = validateActivityContent(parsed.data);
      if (contentErrors.length === 0) return jsonResponse({ activity: parsed.data, fakeMode: process.env.USE_FAKE_MODE === "true" });
      lastError = contentErrors.join(" ");
    }
    return jsonResponse({ error: "We could not create a valid activity yet. Your previous version was kept.", details: process.env.NODE_ENV === "development" ? lastError : undefined }, 422);
  } catch {
    return jsonResponse({ error: "Something went wrong while creating the activity." }, 500);
  }
}
