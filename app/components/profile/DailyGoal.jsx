'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/firebase/firebaseConfig';
import dayjs from 'dayjs';

export default function DailyGoal() {
  const { user } = useAuth();
  const [dailyGoal, setDailyGoal] = useState(5);
  const [completedToday, setCompletedToday] = useState(0);
  const [isGoalMet, setIsGoalMet] = useState(false);

  useEffect(() => {
    const fetchGoalProgress = async () => {
      if (!user) return;

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        const goal = userSnap.exists() ? (userSnap.data().dailyGoal || 5) : 5;
        setDailyGoal(goal);

        const progressDocRef = doc(db, 'users', user.uid, 'progress', 'chapters');
        const progressSnap = await getDoc(progressDocRef);

        if (progressSnap.exists()) {
          const data = progressSnap.data();
          const completedLessons = data.completedLessons || [];

          const today = dayjs().format('YYYY-MM-DD');

          const todayCompletedCount = completedLessons.filter((lesson) => {
            if (typeof lesson === 'object' && lesson.completedAt) {
              return dayjs(lesson.completedAt).format('YYYY-MM-DD') === today;
            }
            return false;
          }).length;

          setCompletedToday(todayCompletedCount);
          setIsGoalMet(todayCompletedCount >= goal);
        }
      } catch (error) {
        console.error('Error fetching daily goal:', error);
      }
    };

    fetchGoalProgress();
  }, [user]);

  const progressPercent = Math.min(100, (completedToday / dailyGoal) * 100);

  return (
    <div
      className="p-4 rounded-xl shadow transition-colors duration-300"
      style={{
        backgroundColor: 'var(--card-background)',
        color: 'var(--text-color)',
      }}
    >
      <p className="font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
        🎯 Daily Goal
      </p>
      <p
        className="text-sm"
        style={{ color: isGoalMet ? 'green' : 'var(--text-color)' }}
      >
        {completedToday}/{dailyGoal} lessons completed today
      </p>

      <div
        className="h-2 mt-2 rounded-full overflow-hidden"
        style={{ backgroundColor: '#d1d5db' /* light gray */ }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: 'var(--color-primary)',
          }}
        ></div>
      </div>

      {isGoalMet && (
        <p className="text-xs mt-2 font-semibold" style={{ color: 'green' }}>
          ✅ Goal Met! Great job!
        </p>
      )}
    </div>
  );
}
