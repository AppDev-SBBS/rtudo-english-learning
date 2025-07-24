'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

import Navbar from '../components/Navbar';
import DailyGoal from '../components/profile/DailyGoal';
import Achievements from '../components/profile/Achievements';
import Preferences from '../components/profile/Preferences';
import LearningSettings from '../components/profile/LearningSettings';
import AccountSettings from '../components/profile/AccountSettings';
import StatsSection from '../components/profile/StatsSection';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [proficiencyLevel, setProficiencyLevel] = useState('Beginner');
  const [learningLanguage, setLearningLanguage] = useState('en');
  const [successMessage, setSuccessMessage] = useState('');
  const [dailyGoal, setDailyGoal] = useState(5);
const [reminderTime, setReminderTime] = useState('08:00');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        router.replace('/');
      } else {
        setUser(u);

        try {
          const userRef = doc(db, 'users', u.uid);
          const docSnap = await getDoc(userRef);

          if (docSnap.exists()) {
  const data = docSnap.data();
  setProficiencyLevel(data.proficiencyLevel || 'Beginner');
  setLearningLanguage(data.learningLanguage || 'en');
  setDailyGoal(data.dailyGoal || 5);          // ✅ Add this
  setReminderTime(data.reminderTime || '08:00'); // ✅ Add this
}

        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="bg-[var(--color-primary)] text-white px-4 py-3 rounded-b-2xl text-center max-w-3xl mx-auto">
        <div className="flex justify-center mb-1">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover border"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white text-[var(--color-primary)] font-bold text-2xl flex items-center justify-center">
              {user?.email?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <h2 className="text-xl font-semibold">
          {user?.displayName?.toUpperCase || user?.email?.split('@')[0]}
        </h2>
        <p className="text-sm opacity-80 break-all">{user?.email}</p>
        <p className="text-xs mt-1">🌐 Learning EN • {proficiencyLevel}</p>
        
      </div>

      <div className="px-4 py-6 max-w-3xl mx-auto space-y-6">
        <StatsSection />
        <DailyGoal />
        <Achievements />
        <Preferences />
        <LearningSettings 
  learningLanguage={learningLanguage} 
  dailyGoal={dailyGoal} 
  reminderTime={reminderTime}
/>

        <AccountSettings
          onSignOut={handleSignOut}
          onProfileUpdate={({ displayName, photoURL }) => {
            setUser((prev) => ({
              ...prev,
              displayName: displayName || prev.displayName,
              photoURL: photoURL || prev.photoURL,
            }));
            setSuccessMessage('Profile updated successfully!');
          }}
        />
      </div>

      <Navbar />
    </div>
  );
}
