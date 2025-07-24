"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/app/firebase/firebaseConfig";
import { FaLock } from "react-icons/fa";
import { PiNotebookDuotone } from "react-icons/pi";
import { MdOutlineAccessTime } from "react-icons/md";
import { BsCheckCircleFill } from "react-icons/bs";
import { IoTrophyOutline } from "react-icons/io5";
import Navbar from "../components/Navbar";
import Loader from "../components/Loader";

export default function ChaptersPage() {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChaptersWithLessons = async () => {
      try {
        const snapshot = await getDocs(collection(db, "chapters"));
        const fetchedChapters = [];

        for (const docSnap of snapshot.docs) {
          const chapterData = docSnap.data();
          const lessonsSnapshot = await getDocs(
            collection(db, "chapters", docSnap.id, "lessons")
          );
          const lessons = lessonsSnapshot.docs.map((d) => d.data());
          lessons.sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);

          fetchedChapters.push({ ...chapterData, lessons });
        }

        fetchedChapters.sort((a, b) => parseInt(a.id) - parseInt(b.id));
        setChapters(fetchedChapters);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching chapters:", error);
        setLoading(false);
      }
    };

    fetchChaptersWithLessons();
  }, []);

  return (
    <div className="relative bg-[var(--background)] text-[var(--text-color)]">
      {/* Fixed Header + Subscription CTA */}
      <div className="fixed top-0 left-0 w-full bg-[var(--background)] z-10 border-b border-[var(--card-border)]">
        <div className="p-2 max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-1">
            Chapters
          </h1>
          <p className="text-sm text-[var(--muted-text)] mb-4">
            Master English step by step
          </p>

          <div className="border border-[var(--card-border)] rounded-xl px-4 py-6 text-center shadow-sm mb-2 bg-[var(--card-background)]">
            <p className="text-[var(--color-primary)] font-bold mb-3 text-base">
              Subscribe to Start Learning
            </p>
            <button className="bg-[var(--color-primary)] text-white font-semibold py-2 px-6 rounded-xl text-sm">
              Subscribe Now
            </button>
          </div>
        </div>
      </div>

      {/* Spacer to prevent overlap */}
      <div className="pt-[250px] px-4 max-w-2xl mx-auto">
        {loading ? (
          <Loader />
        ) : (
          <>
            {/* Chapters */}
            {chapters.map((chapter, idx) => (
              <div
                key={idx}
                className="mb-6 rounded-xl border border-[var(--card-border)] shadow-sm p-4 bg-[var(--card-background)]"
              >
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h2 className="font-bold text-lg text-[var(--color-primary)]">
                      {chapter.title}
                    </h2>
                    <p className="text-xs text-[var(--muted-text)]">
                      {chapter.lessons?.length} lessons • {chapter.duration} mins •{" "}
                      {chapter.isLocked ? "Locked" : "Unlocked"}
                    </p>
                  </div>
                  {chapter.isLocked && <FaLock className="text-[var(--muted-text)] text-lg" />}
                </div>

                <div className="space-y-3">
                  {chapter.lessons?.map((lesson, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-[var(--accent)] px-4 py-3 rounded-xl"
                    >
                      <div className="bg-[var(--color-primary)] rounded-full p-2">
                        <PiNotebookDuotone className="text-white text-lg" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-color)]">
                          {lesson.title || `Lesson ${i + 1}`}
                        </p>
                        <p className="text-xs text-[var(--muted-text)] flex items-center gap-1">
                          <MdOutlineAccessTime className="inline" />
                          {lesson.duration || 15} mins • Complete previous lesson
                        </p>
                      </div>
                      <FaLock className="ml-auto text-[var(--color-primary)]" />
                    </div>
                  ))}

                  {/* Chapter Exam */}
                  {chapter.examEnabled && (
                    <div className="flex items-center justify-between bg-[var(--card-background)] px-4 py-3 rounded-xl border border-dashed border-[var(--card-border)] relative">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#fddcd5] dark:bg-[#4c2e38] rounded-full p-2">
                          <BsCheckCircleFill className="text-[#df695a] dark:text-[#f8cfc8] text-lg" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-color)]">
                            Chapter Exam
                          </p>
                          <p className="text-xs text-[var(--muted-text)]">
                            {chapter.isLocked
                              ? "Complete all lessons to unlock"
                              : "Unlocked"}
                          </p>
                        </div>
                      </div>

                      {chapter.isLocked && (
                        <div className="text-[var(--color-primary)] ml-2">
                          <FaLock className="text-lg" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Final Assessment */}
            <div className="mb-32">
              <h2 className="text-xl font-bold text-[var(--color-primary)] mb-2">
                Final Assessment
              </h2>
              <div className="relative bg-[var(--secondary-background)] border border-[var(--card-border)] rounded-2xl p-4 shadow-sm text-[var(--muted-text)]">
                <div className="flex gap-3 items-center mb-2">
                  <div className="bg-[#f2e2ef] dark:bg-[#3e2c39] p-2 rounded-full">
                    <IoTrophyOutline className="text-[var(--color-primary)] text-xl" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-color)]">Certification Exam</p>
                    <p className="text-xs flex gap-3">
                      <span>2 hours</span>
                      <span>•</span>
                      <span>4 sections</span>
                    </p>
                  </div>
                </div>
                <p className="text-sm mb-3">
                  Complete all chapters to unlock your final assessment and earn your certification.
                </p>

                {/* Lock Overlay */}
                <div className="absolute top-6 right-6 bg-[var(--card-background)] shadow-md px-4 py-2 rounded-xl text-center">
                  <FaLock className="mx-auto mb-1 text-[var(--color-primary)]" />
                  <p className="text-xs font-medium text-[var(--color-primary)]">Locked</p>
                </div>

                {/* Info Note */}
                <div className="text-xs bg-[var(--accent)] text-[var(--color-primary)] px-3 py-2 rounded-lg mt-2">
                  <p>Complete remaining chapters to unlock the final assessment</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Navbar />
    </div>
  );
}
