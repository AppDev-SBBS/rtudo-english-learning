// firebase/storeUser.js
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export const storeUserInFirestore = async (uid, data) => {
  if (!uid || !data) return;

  const userDocRef = doc(db, 'users', uid);

  await setDoc(userDocRef, {
    ...data, // stores all passed fields
    updatedAt: new Date().toISOString()
  }, { merge: true }); // merge so old data is not lost
};
