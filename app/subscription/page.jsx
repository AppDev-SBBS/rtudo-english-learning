"use client";

import { FaBookOpen, FaChalkboardTeacher, FaRobot, FaUser } from "react-icons/fa";
import { MdOutlineHeadphones } from "react-icons/md";
import { PiDownloadSimple, PiTargetBold } from "react-icons/pi";
import { LuPencil } from "react-icons/lu";
import { FiTrendingUp } from "react-icons/fi";
import Navbar from "../components/Navbar";

export default function SubscriptionPlans() {
  return (
    <div className="relative min-h-screen pb-24">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 w-full bg-white z-10 shadow-sm border-b border-gray-100">
        <div className="px-4 py-4 max-w-xl mx-auto">
          <h1 className="text-2xl font-bold text-center text-[var(--color-primary-dark)] mb-1">
            Choose Your Plan
          </h1>
          <p className="text-sm text-gray-500 text-center">
            Select the perfect plan for your learning journey
          </p>
        </div>
      </div>

      {/* Spacer to offset fixed header */}
      <div className="pt-[120px] px-4 max-w-xl mx-auto">
        {/* Basic Plan */}
        <div className="rounded-3xl border border-gray-200 overflow-hidden mb-6 shadow-sm">
          <div className="bg-[#2c82e6]/90 py-8 text-center text-white relative">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#ffffff2a] flex items-center justify-center">
              <LuPencil className="text-3xl" />
            </div>
            <h2 className="text-xl font-semibold">Basic</h2>
            <p className="text-lg font-bold">
              INR 99<span className="text-base font-medium"> /month</span>
            </p>
          </div>
          <ul className="bg-white text-sm px-6 py-4 space-y-3 text-gray-800 font-medium">
            <li className="flex items-center gap-2">
              <FaBookOpen className="text-lg" /> Access to first 5 chapters
            </li>
            <li className="flex items-center gap-2">
              <LuPencil className="text-lg" /> Basic practice exercises
            </li>
            <li className="flex items-center gap-2">
              <MdOutlineHeadphones className="text-lg" /> Standard support
            </li>
            <li className="flex items-center gap-2">
              <FiTrendingUp className="text-lg" /> Progress tracking
            </li>
          </ul>
          <div className="px-6 pb-6 pt-2">
            <button className="w-full bg-[#2c82e6] text-white font-semibold py-2 rounded-xl text-sm">
              Select Plan
            </button>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="rounded-3xl border border-gray-200 overflow-hidden shadow-md relative">
          <div className="bg-[#814096]/90 py-8 text-center text-white relative">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#ffffff2a] flex items-center justify-center">
              <FaRobot className="text-3xl" />
            </div>
            <h2 className="text-xl font-semibold">Pro</h2>
            <p className="text-sm line-through">INR 4,999</p>
            <p className="text-lg font-bold">
              INR 999<span className="text-base font-medium"> /month</span>
            </p>
            <span className="absolute top-2 right-2 bg-white text-[#814096] text-[10px] px-2 py-[2px] font-bold rounded-full shadow-sm">
              Most Popular
            </span>
          </div>
          <ul className="bg-white text-sm px-6 py-4 space-y-3 text-gray-800 font-medium">
            <li className="flex items-center gap-2">
              <FaBookOpen className="text-lg" /> Access to all chapters
            </li>
            <li className="flex items-center gap-2">
              <LuPencil className="text-lg" /> Unlimited practice exercises
            </li>
            <li className="flex items-center gap-2">
              <MdOutlineHeadphones className="text-lg" /> Priority support 24/7
            </li>
            <li className="flex items-center gap-2">
              <PiDownloadSimple className="text-lg" /> Download offline lessons
            </li>
            <li className="flex items-center gap-2">
              <FaRobot className="text-lg" /> AI-powered learning path
            </li>
            <li className="flex items-center gap-2">
              <FaChalkboardTeacher className="text-lg" /> Personal tutor sessions
            </li>
            <li className="flex items-center gap-2">
              <PiTargetBold className="text-lg" /> Custom learning plan
            </li>
          </ul>
          <div className="px-6 pb-6 pt-2">
            <button className="w-full bg-[#814096] text-white font-semibold py-2 rounded-xl text-sm">
              Select Plan
            </button>
          </div>
        </div>
      </div>

      <Navbar />
    </div>
  );
}
