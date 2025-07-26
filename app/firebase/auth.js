import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, db } from "./firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDefaultUserSchema } from "./defaultUserSchema";

const createUserIfNotExists = async (user) => {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const dayjs = (await import("dayjs")).default;
  const today = dayjs().format("YYYY-MM-DD");
  const nowISO = new Date().toISOString();

  if (!snap.exists()) {
    const onboarding = {
      nativeLanguage: localStorage.getItem("nativeLanguage"),
      motivation: localStorage.getItem("motivation"),
      englishLevel: localStorage.getItem("level"),
      source: localStorage.getItem("source"),
      learningTime: JSON.parse(localStorage.getItem("learningTime") || "{}"),
    };

    const defaultUserSchema = getDefaultUserSchema({ user, onboarding });
    await setDoc(userRef, defaultUserSchema, { merge: true });

    // Clean up
    localStorage.removeItem("nativeLanguage");
    localStorage.removeItem("motivation");
    localStorage.removeItem("level");
    localStorage.removeItem("source");
    localStorage.removeItem("learningTime");
  } else {
    const data = snap.data();
    const lastLoginXpDate = data.lastLoginXpDate || null;
    const availableXP = data.availableXP || 0;
    const totalXP = data.totalXP || 0;
    const xpHistory = data.xpHistory || {};
    const todayXP = xpHistory[today] || { earned: 0, source: {} };
    let newAvailableXP = availableXP;
    let newTotalXP = totalXP;

    if (lastLoginXpDate !== today) {
      const dailyXP = 10;
      todayXP.source = todayXP.source || {};
      todayXP.earned += dailyXP;
      todayXP.source.daily = (todayXP.source.daily || 0) + dailyXP;
      newAvailableXP += dailyXP;
      newTotalXP += dailyXP;

      await setDoc(
        userRef,
        {
          lastLoginDate: nowISO,
          lastLoginXpDate: today,
          availableXP: newAvailableXP,
          totalXP: newTotalXP,
          updatedAt: nowISO,
          [`xpHistory.${today}`]: todayXP,
        },
        { merge: true }
      );
    } else {
      await setDoc(
        userRef,
        {
          lastLoginDate: nowISO,
          updatedAt: nowISO,
        },
        { merge: true }
      );
    }
  }
};

export const registerUser = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  await createUserIfNotExists(user);
  return user;
};

export const signInUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  await createUserIfNotExists(user);
  return user;
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  await createUserIfNotExists(user);
  return user;
};

export const resetPassword = async (email) => {
  return await sendPasswordResetEmail(auth, email);
};

export const logoutUser = () => signOut(auth);
export const observeAuthState = (callback) => onAuthStateChanged(auth, callback);
