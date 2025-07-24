"use client";

import {
  FaBookOpen,
  FaChalkboardTeacher,
  FaRobot,
  FaUser,
} from "react-icons/fa";
import { MdOutlineHeadphones } from "react-icons/md";
import { PiDownloadSimple, PiTargetBold } from "react-icons/pi";
import { LuPencil } from "react-icons/lu";
import { FiTrendingUp } from "react-icons/fi";
import Navbar from "../components/Navbar";

export default function SubscriptionPlans() {
  return (
    <div
      className="relative min-h-screen pb-24 transition-colors duration-300"
      style={{
        backgroundColor: "var(--background)",
        color: "var(--text-color)",
      }}
    >
      {/* Fixed Header */}
      <div
        className="fixed top-0 left-0 w-full z-10 shadow-sm border-b"
        style={{
          backgroundColor: "var(--card-background)",
          borderColor: "var(--card-border)",
        }}
      >
        <div className="px-4 py-4 max-w-xl mx-auto text-center">
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: "var(--color-primary)" }}
          >
            Choose Your Plan
          </h1>
          <p
            className="text-sm"
            style={{ color: "var(--muted-text)" }}
          >
            Select the perfect plan for your learning journey
          </p>
        </div>
      </div>

      {/* Spacer to offset header */}
      <div className="pt-[120px] px-4 max-w-xl mx-auto">
        {/* Basic Plan */}
        <div
          className="rounded-3xl border overflow-hidden mb-6 shadow-sm transition-all"
          style={{ borderColor: "var(--card-border)" }}
        >
          <div className="py-8 text-center text-white relative"
            style={{ backgroundColor: "#2c82e6" }}
          >
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
              <LuPencil className="text-3xl" />
            </div>
            <h2 className="text-xl font-semibold">Basic</h2>
            <p className="text-lg font-bold">
              INR 99<span className="text-base font-medium"> /month</span>
            </p>
          </div>
          <ul
            className="text-sm px-6 py-4 space-y-3 font-medium"
            style={{
              backgroundColor: "var(--card-background)",
              color: "var(--text-color)",
            }}
          >
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
            <button
              className="w-full py-2 rounded-xl text-sm font-semibold"
              style={{
                backgroundColor: "#2c82e6",
                color: "#ffffff",
              }}
            >
              Select Plan
            </button>
          </div>
        </div>

        {/* Pro Plan */}
        <div
          className="rounded-3xl border overflow-hidden shadow-md relative transition-all"
          style={{ borderColor: "var(--card-border)" }}
        >
          <div className="py-8 text-center text-white relative"
            style={{ backgroundColor: "#814096" }}
          >
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
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
          <ul
            className="text-sm px-6 py-4 space-y-3 font-medium"
            style={{
              backgroundColor: "var(--card-background)",
              color: "var(--text-color)",
            }}
          >
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
            <button
              className="w-full py-2 rounded-xl text-sm font-semibold"
              style={{
                backgroundColor: "#814096",
                color: "#ffffff",
              }}
            >
              Select Plan
            </button>
          </div>
        </div>
      </div>

      <Navbar />
    </div>
  );
}
