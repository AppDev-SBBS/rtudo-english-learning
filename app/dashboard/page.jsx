"use client";

import Header from "../components/dashboard/Header";
import TodayProgressCard from "../components/dashboard/TodayProgressCard";
import NextLesson from "../components/dashboard/NextLesson";
import PracticeSkillsCard from "../components/dashboard/Practice";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans relative">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 w-full bg-white z-10 border-b border-gray-100 shadow-sm">
        <div className="px-4 py-4 max-w-3xl mx-auto">
          <Header />
        </div>
      </div>

      {/* Scrollable Content with Spacing */}
      <div className="pt-[100px] pb-28 px-4 max-w-3xl mx-auto space-y-6">
        <TodayProgressCard />
        <NextLesson />
        <PracticeSkillsCard />
      </div>

      {/* Bottom Navigation */}
      <Navbar />
    </div>
  );
}
