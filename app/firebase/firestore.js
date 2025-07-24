// firebase/firestore.js
import { db } from './firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

export const saveUserData = async (uid, data) => {
  const userDocRef = doc(db, 'users', uid);
  await setDoc(userDocRef, data);
};
