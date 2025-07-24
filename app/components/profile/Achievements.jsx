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
    <div
      className="p-4 rounded-xl transition-colors duration-300"
      style={{ backgroundColor: 'var(--card-background)' }}
    >
      <p
        className="font-bold mb-4"
        style={{ color: 'var(--color-primary)' }}
      >
        🏆 Achievements
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div
          className="p-3 rounded-xl text-center shadow-sm transition-colors duration-300"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--text-color)',
          }}
        >
          <p className="font-semibold">🔥 7 Day Streak</p>
          <p style={{ color: 'var(--muted-text)', fontSize: '12px' }}>
            {Math.min(streak, 7)}/7
          </p>
        </div>
        <div
          className="p-3 rounded-xl text-center shadow-sm transition-colors duration-300"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--text-color)',
          }}
        >
          <p className="font-semibold">📘 Quick Learner</p>
          <p style={{ color: 'var(--muted-text)', fontSize: '12px' }}>
            {Math.min(completedLessons, 10)}/10
          </p>
        </div>
      </div>
    </div>
  );
}
