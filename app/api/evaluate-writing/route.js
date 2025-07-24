import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure this is set in .env.local
});

export async function POST(req) {
  const { text } = await req.json();

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are an English writing evaluator. Return only PASS or FAIL based on grammar, coherence, and minimum word count (over 30 words).",
        },
        {
          role: "user",
          content: text,
        },
      ],
      model: "gpt-3.5-turbo", // ✅ use gpt-3.5-turbo for compatibility
    });

    const resultText = completion.choices[0].message.content.trim();
    const result = resultText.includes("PASS") ? "PASS" : "FAIL";

    return NextResponse.json({ result });
  } catch (error) {
    console.error("OpenAI writing evaluation failed:", error);
    return NextResponse.json({ error: "Evaluation failed" }, { status: 500 });
  }
}
