"use client";
import { FaPlay } from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function NextLessonCard() {
  const router = useRouter();

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Next Lesson</h3>
        <button
          onClick={() => router.push("/lessons")}
          className="text-[var(--color-primary)] text-sm font-medium cursor-pointer hover:underline"
        >
          View All
        </button>
      </div>

      <div className="bg-purple-50 p-4 rounded-lg flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="bg-[var(--color-primary)] text-white text-xs font-medium px-3 py-1 rounded-full">
            Introduction to Basic Grammar
          </span>
          <span className="text-sm text-gray-700">15 mins</span>
        </div>

        <div className="flex justify-between items-center">
          <h4 className="text-lg font-semibold text-gray-800">Nouns</h4>
          <button
            onClick={() => router.push("/lessons")}
            className="bg-[var(--color-primary)] p-2 rounded-full text-white cursor-pointer hover:scale-105 transition"
          >
            <FaPlay />
          </button>
        </div>

        <div className="w-full bg-gray-200 h-1 rounded-full">
          <div className="bg-[var(--color-primary)] h-1 w-[0%] rounded-full"></div>
        </div>
        <p className="text-sm text-gray-500">0% Complete</p>
      </div>
    </div>
  );
}
