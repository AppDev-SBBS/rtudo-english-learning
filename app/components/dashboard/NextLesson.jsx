"use client";
import { FaPlay } from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function NextLessonCard() {
  const router = useRouter();

  return (
    <div 
      className="rounded-xl shadow p-4 transition-all duration-300"
      style={{
        backgroundColor: 'var(--card-background)',
        borderColor: 'var(--card-border)',
        color: 'var(--text-color)'
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 
          className="text-lg font-bold"
          style={{ color: 'var(--text-color)' }}
        >
          Next Lesson
        </h3>
        <button
          onClick={() => router.push("/lessons")}
          className="text-sm font-medium cursor-pointer hover:underline transition-colors duration-200"
          style={{ color: 'var(--color-primary)' }}
        >
          View All
        </button>
      </div>

      <div 
        className="p-4 rounded-lg flex flex-col gap-2 transition-all duration-300"
        style={{ backgroundColor: 'var(--accent)' }}
      >
        <div className="flex justify-between items-center">
          <span 
            className="text-white text-xs font-medium px-3 py-1 rounded-full"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Introduction to Basic Grammar
          </span>
          <span 
            className="text-sm"
            style={{ color: 'var(--muted-text)' }}
          >
            15 mins
          </span>
        </div>

        <div className="flex justify-between items-center">
          <h4 
            className="text-lg font-semibold"
            style={{ color: 'var(--text-color)' }}
          >
            Nouns
          </h4>
          <button
            onClick={() => router.push("/lessons")}
            className="p-2 rounded-full text-white cursor-pointer hover:scale-105 transition-transform duration-200"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <FaPlay />
          </button>
        </div>

        <div 
          className="w-full h-1 rounded-full"
          style={{ backgroundColor: 'var(--secondary-background)' }}
        >
          <div 
            className="h-1 w-[0%] rounded-full transition-all duration-300"
            style={{ backgroundColor: 'var(--color-primary)' }}
          ></div>
        </div>
        <p 
          className="text-sm"
          style={{ color: 'var(--muted-text)' }}
        >
          0% Complete
        </p>
      </div>
    </div>
  );
}