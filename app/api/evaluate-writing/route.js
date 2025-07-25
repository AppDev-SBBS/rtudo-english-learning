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
      content: `
You are an IELTS Writing Task 2 examiner. Evaluate the following written response based on these IELTS Band Descriptors:

- **Task Response**: Is the question fully addressed with relevant ideas?
- **Coherence and Cohesion**: Is the response well-organized with clear progression of ideas?
- **Lexical Resource** (Vocabulary): Is there a sufficient range of vocabulary used appropriately?
- **Grammatical Range and Accuracy**: Is the grammar mostly error-free and varied?

Minimum: 30 words.

If the response shows competence in grammar and vocabulary and overall performance is IELTS Band 6.0 or above, return:
**PASS**

If there are serious issues in grammar or vocabulary or overall performance is below Band 6.0, return:
**FAIL**

Respond with only: **PASS** or **FAIL**
      `.trim(),
    },
    {
      role: "user",
      content: text,
    },
  ],
  model: "gpt-3.5-turbo",
});


    const resultText = completion.choices[0].message.content.trim();
    const result = resultText.includes("PASS") ? "PASS" : "FAIL";

    return NextResponse.json({ result });
  } catch (error) {
    console.error("OpenAI writing evaluation failed:", error);
    return NextResponse.json({ error: "Evaluation failed" }, { status: 500 });
  }
}
