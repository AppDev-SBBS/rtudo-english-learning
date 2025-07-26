import { OpenAI } from "openai";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/app/firebase/firebaseConfig";

export async function getOpenAIInstance() {
  let apiKey = process.env.OPENAI_API_KEY;

  // If env var not set, fetch from Firestore
  if (!apiKey) {
    try {
      const docRef = doc(db, "settings", "openai");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        apiKey = data.api_key || data.apiKey || null;
      }
    } catch (err) {
      console.error("Failed to fetch OpenAI API key from Firestore:", err);
    }
  }

  if (!apiKey) {
    throw new Error("OpenAI API key is not set in env or Firestore");
  }

  return new OpenAI({ apiKey });
}
