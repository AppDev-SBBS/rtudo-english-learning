// firebase/firestore.js
import { db } from './firebaseConfig';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';

// Save user profile data
export const saveUserData = async (uid, data) => {
  const userDocRef = doc(db, 'users', uid);
  await setDoc(userDocRef, data, { merge: true });
};

// Create a new chat session (called once per new conversation)
export const createChatSession = async (uid, mode = "chat") => {
  const chatRef = collection(db, `users/${uid}/chatHistory`);
  const newChatDoc = await addDoc(chatRef, {
    startTime: serverTimestamp(),
    lastUpdated: serverTimestamp(),
    mode,
    messages: [],
  });
  return newChatDoc.id; // return chat ID
};

// Append message to existing chat session
export const appendMessageToChat = async (uid, chatId, message) => {
  const chatDocRef = doc(db, `users/${uid}/chatHistory/${chatId}`);
  await updateDoc(chatDocRef, {
    messages: arrayUnion({
      id: Date.now().toString(),
      text: message.text,
      isUser: message.isUser,
      isVoice: message.isVoice || false,
      timestamp: new Date(),
    }),
    lastUpdated: new Date(),
  });
};

// Fetch all chat history sorted by start time
export const fetchChatHistory = async (uid, mode = "chat") => {
  const chatRef = collection(db, `users/${uid}/chatHistory`);
  const q = query(chatRef, where("mode", "==", mode), orderBy("startTime", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
