"use client";

import { useEffect, useState, useRef } from "react";
import {
  FaClock,
  FaStar,
  FaFire,
  FaBookOpen,
  FaMicrophone,
  FaRobot,
} from "react-icons/fa";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/app/firebase/firebaseConfig";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Loader from "@/app/components/Loader";

export default function TodayProgressCard() {
  const { user } = useAuth();
  const [minutesToday, setMinutesToday] = useState(0);
  const [dailyXP, setDailyXP] = useState(0);
  const [streak, setStreak] = useState(1);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const dailyGoal = 30;
  const progressPercent = Math.min((minutesToday / dailyGoal) * 100, 100);

  useEffect(() => {
    if (!user) return;

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const userRef = doc(db, "users", user.uid);

    const fetchAndSetStats = async () => {
      const snap = await getDoc(userRef);
      if (!snap.exists()) return;

      const data = snap.data();
      const lastLoginDateStr = data.lastLoginXpDate || "";
      const lastMinutesDateStr = data.minutesDate || "";
      const currentStreak = data.streak || 1;
      const savedMinutes = data.minutesToday || 0;

      // ✅ Daily XP from xpHistory
      const xpToday = data.xpHistory?.[todayStr] || {};
      const todayDailyXP = xpToday.source?.daily || 0;
      setDailyXP(todayDailyXP);

      // ✅ Streak logic
      const lastLoginDate = new Date(lastLoginDateStr);
      const diffInDays = Math.floor(
        (today - lastLoginDate) / (1000 * 60 * 60 * 24)
      );
      let newStreak = 1;

      if (lastLoginDateStr !== todayStr) {
        if (diffInDays === 1) {
          newStreak = currentStreak + 1;
        } else {
          newStreak = 1;
        }

        await updateDoc(userRef, {
          streak: newStreak,
          lastLoginXpDate: todayStr,
        });
        setStreak(newStreak);
      } else {
        setStreak(currentStreak);
      }

      // ✅ Minutes logic
      if (lastMinutesDateStr === todayStr) {
        setMinutesToday(savedMinutes);
      } else {
        await updateDoc(userRef, {
          minutesToday: 0,
          minutesDate: todayStr,
        });
        setMinutesToday(0);
      }

      setLoading(false);
    };

    fetchAndSetStats();
  }, [user]);

  // ✅ Track minutes
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const todayStr = new Date().toISOString().split("T")[0];

    intervalRef.current = setInterval(() => {
      setMinutesToday((prev) => {
        const updated = prev + 1;

        updateDoc(userRef, {
          minutesToday: updated,
          minutesDate: todayStr,
        });

        return updated;
      });
    }, 60000);

    return () => clearInterval(intervalRef.current);
  }, [user]);

  if (loading) return <Loader />;

  return (
    <section className="bg-purple-50 p-4 rounded-xl shadow space-y-6">
      <h1 className="text-xl font-bold text-gray-800 mb-2">Today's Progress</h1>

      {/* Row 1: Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<FaClock />} value={minutesToday} label="Minutes Today" />
        <StatCard icon={<FaStar />} value={dailyXP} label="Daily XP" />
        <StatCard icon={<FaFire />} value={streak} label="Day Streak" />
      </div>

      {/* Row 2: Streak & Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow flex flex-col justify-center items-center text-center">
          <FaFire className="text-[var(--color-primary)] text-2xl mb-2" />
          <h3 className="text-lg font-bold text-[var(--color-primary)]">
            {streak} Day Streak
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Keep learning daily to maintain your streak
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <div className="flex justify-between mb-1 text-sm text-gray-700 font-medium">
            <span>Daily Progress</span>
            <span>{Math.max(dailyGoal - minutesToday, 0)} min left</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div
              className="bg-[var(--color-primary)] h-2.5 rounded-full"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">
            {minutesToday} / {dailyGoal} minutes
          </p>
        </div>
      </div>

      {/* Row 3: Task List */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TaskItem
          icon={<FaBookOpen />}
          label="Complete Daily Lesson"
          xp={25}
          path="/lessons"
        />
        <TaskItem
          icon={<FaMicrophone />}
          label="Practice Speaking"
          xp={15}
          path="/practice/exam/speaking"
        />
        <TaskItem
          icon={<FaRobot />}
          label="Talk with AI"
          xp={10}
          path="/ai"
        />
      </div>
    </section>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow flex flex-col items-center text-center">
      <div className="text-[var(--color-primary)] text-2xl mb-2">{icon}</div>
      <div className="text-xl font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

function TaskItem({ icon, label, xp, path }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(path)}
      className="bg-white p-4 rounded-xl shadow text-center flex flex-col items-center justify-center w-full transition hover:scale-[1.02] cursor-pointer"
    >
      <div className="text-[var(--color-primary)] text-2xl mb-2">{icon}</div>
      <h4 className="text-gray-800 font-medium">{label}</h4>
      <p className="text-sm text-[var(--color-primary)] font-semibold mt-1">
        {xp} XP
      </p>
    </button>
  );
}
