'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/firebase/firebaseConfig';

export default function Achievements() {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(0);

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!user) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          setStreak(data.streak || 0);
          setCompletedLessons(data.completedLessons || 0);
        }
      } catch (err) {
        console.error('Error fetching achievements:', err);
      }
    };

    fetchAchievements();
  }, [user]);

  return (
    <div className="bg-gray-100 p-4 rounded-xl">
      <p className="font-bold text-[var(--color-primary)] mb-4">🏆 Achievements</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-3 rounded-xl text-center shadow-sm">
          <p className="font-semibold">🔥 7 Day Streak</p>
          <p className="text-xs text-gray-600">{Math.min(streak, 7)}/7</p>
        </div>
        <div className="bg-white p-3 rounded-xl text-center shadow-sm">
          <p className="font-semibold">📘 Quick Learner</p>
          <p className="text-xs text-gray-600">{Math.min(completedLessons, 10)}/10</p>
        </div>
      </div>
    </div>
  );
}
