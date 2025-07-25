'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/app/firebase/firebaseConfig';
import {
  FaStar,
  FaCalendarCheck,
  FaBookOpen,
  FaArrowUp,
} from 'react-icons/fa';

export default function StatsSection({ userData }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    availableXP: 0,
    activeDays: 0,
    completedLessons: 0,
    level: 1,
  });

  useEffect(() => {
    if (userData) {
      setStats({
        availableXP: userData.availableXP || 0,
        activeDays: userData.activeDays || 0,
        completedLessons: userData.completedLessons || 0,
        level: userData.level || 1,
      });
      return;
    }

    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();

          setStats({
            availableXP: data.availableXP || 0,
            activeDays: data.activeDays || 0,
            completedLessons: data.completedLessons || 0,
            level: data.level || 1,
          });
        }
      },
      (error) => {
        console.error('Error listening to stats:', error);
      }
    );

    return () => unsubscribe();
  }, [user, userData]);

  const statItems = [
    {
      label: 'Available XP',
      value: stats.availableXP,
      icon: <FaStar size={16} color="var(--color-primary)" />,
    },
    {
      label: 'Days Active',
      value: stats.activeDays,
      icon: <FaCalendarCheck size={16} color="var(--color-primary)" />,
    },
    {
      label: 'Lessons Completed',
      value: stats.completedLessons,
      icon: <FaBookOpen size={16} color="var(--color-primary)" />,
    },
    {
      label: 'Level',
      value: stats.level,
      icon: <FaArrowUp size={16} color="var(--color-primary)" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-semibold">
      {statItems.map((item, idx) => (
        <div key={idx}>
          <div className="flex justify-center items-center gap-1 mb-1">
            {item.icon}
            <p className="text-lg" style={{ color: 'var(--color-primary)' }}>
              {item.value}
            </p>
          </div>
          <p className="text-xs" style={{ color: 'var(--muted-text)' }}>
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
