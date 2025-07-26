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

/* ---------------------------- 🔹 USER PROFILE ---------------------------- */
export const saveUserData = async (uid, data) => {
  const userDocRef = doc(db, 'users', uid);
  await setDoc(userDocRef, data, { merge: true });
};

/* ---------------------------- 🔹 CHAT SYSTEM ---------------------------- */
export const createChatSession = async (uid, mode = "chat") => {
  const chatRef = collection(db, `users/${uid}/chatHistory`);
  const newChatDoc = await addDoc(chatRef, {
    startTime: serverTimestamp(),
    lastUpdated: serverTimestamp(),
    mode,
    messages: [],
  });
  return newChatDoc.id;
};

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

export const fetchChatHistory = async (uid, mode = "chat") => {
  const chatRef = collection(db, `users/${uid}/chatHistory`);
  const q = query(chatRef, where("mode", "==", mode), orderBy("startTime", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

/* ---------------------------- 🔹 SUBSCRIPTIONS ---------------------------- */
export const saveSubscriptionData = async (userId, subscriptionData, features) => {
  const globalData = {
    ...subscriptionData,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // 1️⃣ Global collection (optional analytics)
  await addDoc(collection(db, 'subscription'), globalData);

  // 2️⃣ User-specific subscription details
  const userSubRef = doc(db, `users/${userId}/subscription`, 'details');
  const userSubData = {
    plan: subscriptionData.planId,
    amount: subscriptionData.amount,
    currency: subscriptionData.currency,
    startDate: subscriptionData.startDate,
    endDate: subscriptionData.endDate,
    isActive: true,
    features,
  };

  await setDoc(userSubRef, userSubData, { merge: true });
};

/* ---------------------------- 🔹 PROGRESS TRACKING ---------------------------- */
// 🔸 Use a single centralized progress document
const getUserProgressRef = (userId) =>
  doc(db, "users", userId, "progress", "chapters");

export const markLessonCompleted = async (userId, lessonId, chapterId, totalLessons) => {
  console.log("🔥 markLessonCompleted called with:", { userId, lessonId, chapterId, totalLessons });
  
  if (!userId || !lessonId || !chapterId || !totalLessons) {
    console.error("❌ Missing required parameters:", { userId, lessonId, chapterId, totalLessons });
    return false;
  }

  const progressRef = doc(db, "users", userId, "progress", "chapters");

  try {
    const docSnap = await getDoc(progressRef);
    
    // Create a consistent lesson key format
    const lessonKey = `${chapterId}-${lessonId}`;
    console.log("🔑 Generated lesson key:", lessonKey);

    if (!docSnap.exists()) {
      console.log("📝 Creating new progress document");
      await setDoc(progressRef, {
        completedLessons: [lessonKey],
        lastCompletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log("✅ New progress document created successfully");
    } else {
      const data = docSnap.data();
      const currentCompletedLessons = data.completedLessons || [];
      
      console.log("📋 Current completed lessons:", currentCompletedLessons);
      
      if (!currentCompletedLessons.includes(lessonKey)) {
        console.log("➕ Adding new lesson to completed list");
        await updateDoc(progressRef, {
          completedLessons: arrayUnion(lessonKey),
          lastCompletedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        console.log("✅ Lesson marked as completed successfully");
      } else {
        console.log("⚠️ Lesson already marked as completed");
      }
    }

    // Verify the update
    const updatedDoc = await getDoc(progressRef);
    const updatedData = updatedDoc.data();
    console.log("🔍 Updated document data:", updatedData);
    console.log("📊 Total completed lessons:", updatedData?.completedLessons?.length || 0);

    return true;

  } catch (err) {
    console.error("❌ Error marking lesson complete:", err);
    throw err;
  }
};

/**
 * Save chapter exam as completed.
 * @param {string} userId 
 * @param {string} chapterId 
 */
export const markChapterExamCompleted = async (userId, chapterId) => {
  console.log("🎯 markChapterExamCompleted called with:", { userId, chapterId });
  
  if (!userId || !chapterId) {
    console.error("❌ Missing required parameters for exam completion");
    return false;
  }
  
  const progressRef = getUserProgressRef(userId);

  try {
    const snap = await getDoc(progressRef);
    if (!snap.exists()) {
      await setDoc(progressRef, {
        completedExams: [chapterId],
        updatedAt: serverTimestamp(),
      });
      console.log("✅ New exam progress document created");
    } else {
      const data = snap.data();
      if (!data.completedExams?.includes(chapterId)) {
        await updateDoc(progressRef, {
          completedExams: arrayUnion(chapterId),
          updatedAt: serverTimestamp(),
        });
        console.log("✅ Chapter exam marked as completed");
      } else {
        console.log("⚠️ Chapter exam already completed");
      }
    }
    return true;
  } catch (err) {
    console.error("❌ Error updating completedExams:", err);
    throw err;
  }
};

/**
 * Mark full chapter as completed (only if all lessons + exam done).
 * @param {string} userId 
 * @param {string} chapterId 
 * @param {number} totalLessons 
 */
export const markChapterCompletedIfEligible = async (userId, chapterId, totalLessons) => {
  console.log("🏆 Checking chapter completion eligibility:", { userId, chapterId, totalLessons });
  
  if (!userId || !chapterId || !totalLessons) {
    console.error("❌ Missing parameters for chapter completion check");
    return false;
  }

  const progressRef = getUserProgressRef(userId);

  try {
    const snap = await getDoc(progressRef);
    if (!snap.exists()) {
      console.log("⚠️ No progress document found");
      return false;
    }

    const data = snap.data();
    const completedLessons = data.completedLessons || [];
    const completedExams = data.completedExams || [];
    const completedChapters = data.completedChapters || [];

    // Lessons must have IDs like "chapter1-lesson1"
    const chapterLessonsCompleted = completedLessons.filter(id => id.startsWith(`${chapterId}-`));
    const allLessonsCompleted = chapterLessonsCompleted.length === totalLessons;
    const examCompleted = completedExams.includes(chapterId);

    console.log("📊 Chapter completion status:", {
      chapterLessonsCompleted: chapterLessonsCompleted.length,
      totalLessons,
      allLessonsCompleted,
      examCompleted,
      alreadyCompleted: completedChapters.includes(chapterId)
    });

    if (allLessonsCompleted && examCompleted && !completedChapters.includes(chapterId)) {
      await updateDoc(progressRef, {
        completedChapters: arrayUnion(chapterId),
        lastCompletedChapter: chapterId,
        updatedAt: serverTimestamp(),
      });
      console.log("🎉 Chapter marked as fully completed!");
      return true;
    } else if (!allLessonsCompleted) {
      console.log(`⏳ Chapter not complete: ${chapterLessonsCompleted.length}/${totalLessons} lessons done`);
    } else if (!examCompleted) {
      console.log("⏳ Chapter not complete: exam not completed");
    }
    
    return false;
  } catch (err) {
    console.error("❌ Error checking or updating chapter completion:", err);
    throw err;
  }
};

/**
 * Get user progress data
 * @param {string} userId 
 */
export const getUserProgress = async (userId) => {
  if (!userId) return null;
  
  try {
    const progressRef = getUserProgressRef(userId);
    const snap = await getDoc(progressRef);
    
    if (snap.exists()) {
      return snap.data();
    }
    return {
      completedLessons: [],
      completedExams: [],
      completedChapters: []
    };
  } catch (err) {
    console.error("❌ Error fetching user progress:", err);
    return null;
  }
};