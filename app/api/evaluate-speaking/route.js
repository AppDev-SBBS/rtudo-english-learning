import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import formidable from "formidable";
import fs from "fs";
import { Readable } from "stream";

// Required for form uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Parse form data correctly in App Router
async function parseFormData(req) {
  const form = formidable({ multiples: false, keepExtensions: true });

  const chunks = [];
  const reader = req.body.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const rawBody = Buffer.concat(chunks);
  const stream = Readable.from(rawBody);

  // Convert Headers to Node-style headers object
  const headers = {};
  req.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  if (!headers["content-length"]) {
    headers["content-length"] = rawBody.length.toString(); // Set manually
  }

  const fakeReq = Object.assign(stream, {
    headers,
    method: "POST",
    url: "",
  });

  return new Promise((resolve, reject) => {
    form.parse(fakeReq, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}


export async function POST(req) {
  try {
    const { fields, files } = await parseFormData(req);
    const file = files.audio?.[0];

    if (!file) {
      return NextResponse.json({ error: "No audio file received" }, { status: 400 });
    }

    const audioPath = file.filepath;

    // Transcribe using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
    });

    const text = transcription.text;

    // Evaluate with GPT
    const prompt = `
You are an IELTS Speaking examiner.

Evaluate the following spoken response using IELTS Speaking Band Descriptors:

- **Fluency and Coherence**: Does the speaker speak clearly and at length without unnatural hesitation?
- **Lexical Resource** (Vocabulary): Does the speaker use a wide range of vocabulary accurately and appropriately?
- **Grammatical Range and Accuracy**: Are there few grammatical errors, and is the grammar varied and correct?
- **Pronunciation**: Is the speech clear and easy to understand?

Minimum word count: 50 words.

Response:
"${text}"

If the speaker shows adequate performance in all areas and is at IELTS Band 6.0 or higher, respond with:
**PASS**

If the speaker falls below IELTS Band 6.0 in grammar or vocabulary (or overall), respond with:
**FAIL**

Your answer must be one word only: **PASS** or **FAIL**
`;



    const result = await openai.chat.completions.create({
  model: "gpt-3.5-turbo", // Change this line
  messages: [{ role: "user", content: prompt }],
});


    const decision = result.choices[0].message.content.trim().toUpperCase();

    return NextResponse.json({
      result: decision === "PASS" ? "PASS" : "FAIL",
      transcript: text,
    });
  } catch (error) {
    console.error("Error evaluating speaking:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
