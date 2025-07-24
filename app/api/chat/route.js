import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // ✅ Ensure this is available to your project
      messages: [
        {
          role: "system",
          content:
            "You are a friendly and expert IELTS trainer helping students improve speaking, writing, reading, and listening skills. Respond like a real IELTS coach with clear, actionable feedback.",
        },
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.text,
        })),
      ],
    });

    const reply = completion.choices[0].message.content;

    return Response.json({ reply });
  } catch (err) {
    console.error("Chat API error:", err);
    return Response.json({ error: "Failed to generate reply" }, { status: 500 });
  }
}
