'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/firebase/firebaseConfig';

export default function StatsSection() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    availableXP: 0,
    activeDays: 0,
    completedLessons: 0,
    level: 1,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();

          const availableXP = data.availableXP || 0;
          const completedLessons = data.completedLessons || 0;
          const level = data.level || 1;

          const dailyUsage = data.appUsage?.dailyUsage || [];
          const uniqueDates = new Set(dailyUsage.map((entry) => entry.date));
          const activeDays = uniqueDates.size;

          setStats({
            availableXP,
            activeDays,
            completedLessons,
            level,
          });
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-[var(--color-primary)] font-semibold">
      <div>
        <p className="text-lg">{stats.availableXP}</p>
        <p className="text-xs text-gray-500">Available XP</p>
      </div>

      <div>
        <p className="text-lg">{stats.activeDays}</p>
        <p className="text-xs text-gray-500">Days Active</p>
      </div>

      <div>
        <p className="text-lg">{stats.completedLessons}</p>
        <p className="text-xs text-gray-500">Lessons Completed</p>
      </div>

      <div>
        <p className="text-lg">{stats.level}</p>
        <p className="text-xs text-gray-500">Level</p>
      </div>
    </div>
  );
}
