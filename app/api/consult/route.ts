import { retrieveKnowledge, salonKnowledge } from "@/app/lib/knowledge";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  let body: { messages?: unknown };
  try {
    body = await request.json() as { messages?: unknown };
  } catch {
    return Response.json({ error: "Send a valid message to the beauty desk." }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json({ error: "Add a message so Nurse Joy-Bot can help." }, { status: 400 });
  }

  const messages = body.messages
    .filter((message): message is ChatMessage =>
      typeof message === "object" && message !== null &&
      "role" in message && (message.role === "user" || message.role === "assistant") &&
      "content" in message && typeof message.content === "string")
    .slice(-8)
    .map((message) => ({ role: message.role, content: message.content.slice(0, 1000) }));
  const latestQuestion = [...messages].reverse().find((message) => message.role === "user")?.content;
  if (!latestQuestion) return Response.json({ error: "Add a question for Nurse Joy-Bot." }, { status: 400 });

  const matches = retrieveKnowledge(latestQuestion);
  const context = (matches.length ? matches : salonKnowledge.slice(0, 2))
    .map((chunk) => `${chunk.title}: ${chunk.content}`)
    .join("\n\n");
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.6,
          messages: [
            {
              role: "system",
              content: `You are Nurse Joy-Bot, a warm salon beauty consultant. Answer briefly and kindly, in character. Ground salon recommendations only in these retrieved notes; never invent ingredients or medical benefits. Mention patch tests for sensitivities and direct persistent symptoms to a qualified clinician. Salon rituals are cosmetic, not medical care. Retrieved notes:\n${context}`,
            },
            ...messages,
          ],
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (response.ok) {
        const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
        const reply = result.choices?.[0]?.message?.content;
        if (reply) return Response.json({ reply, sources: matches.map((chunk) => chunk.id) });
      }
    } catch {}
  }

  const answer = (matches[0] ?? salonKnowledge[6]).answer;
  const extra = matches[1] ? ` You might also like ${matches[1].title}.` : "";
  return Response.json({ reply: `${answer}${extra}`, sources: matches.map((chunk) => chunk.id), mode: "local-rag" });
}