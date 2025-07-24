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
        // Get user's daily goal
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        const goal = userSnap.exists() ? (userSnap.data().dailyGoal || 5) : 5;
        setDailyGoal(goal);

        // Get progress/completed lessons
        const progressDocRef = doc(db, 'users', user.uid, 'progress', 'chapters');
        const progressSnap = await getDoc(progressDocRef);

        if (progressSnap.exists()) {
          const data = progressSnap.data();
          const completedLessons = data.completedLessons || [];

          const today = dayjs().format('YYYY-MM-DD');

          // ✅ Count only lessons completed today
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
    <div className="bg-gray-100 p-4 rounded-xl shadow">
      <p className="font-bold text-[var(--color-primary)] mb-1">🎯 Daily Goal</p>
      <p className={`text-sm ${isGoalMet ? 'text-green-600' : 'text-gray-700'}`}>
        {completedToday}/{dailyGoal} lessons completed today
      </p>

      <div className="h-2 mt-2 bg-gray-300 rounded-full">
        <div
          className="bg-[var(--color-primary)] h-full rounded-full"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {isGoalMet && (
        <p className="text-xs mt-2 text-green-600 font-semibold">
          ✅ Goal Met! Great job!
        </p>
      )}
    </div>
  );
}
