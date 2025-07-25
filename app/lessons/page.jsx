"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/app/firebase/firebaseConfig";
import { useAuth } from "@/app/context/AuthContext";
import { FaLock } from "react-icons/fa";
import { PiNotebookDuotone } from "react-icons/pi";
import { MdOutlineAccessTime } from "react-icons/md";
import { BsCheckCircleFill } from "react-icons/bs";
import { IoTrophyOutline } from "react-icons/io5";
import Navbar from "../components/Navbar";
import Loader from "../components/Loader";
import { useRouter } from "next/navigation";
import { markLessonCompleted, markChapterCompletedIfEligible, getUserProgress } from "../firebase/firestore";

export default function ChaptersPage() {
  const { user } = useAuth();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [userPlan, setUserPlan] = useState(null);
  const [userProgress, setUserProgress] = useState({
    completedLessons: [],
    completedExams: [],
    completedChapters: []
  });
  const router = useRouter();

  const checkSubscription = async () => {
    if (!user?.uid) return;
    try {
      const docRef = doc(db, "subscriptions", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const now = new Date();
        if (data.status === "active" && data.expiresAt.toDate() > now) {
          setSubscription(data);
          setUserPlan(data.planType); // "basic" or "pro"
        }
      }
    } catch (err) {
      console.error("Subscription check failed", err);
    }
  };

  const loadUserProgress = async () => {
    if (!user?.uid) return;
    try {
      const progress = await getUserProgress(user.uid);
      if (progress) {
        setUserProgress(progress);
        console.log("📊 User progress loaded:", progress);
      }
    } catch (err) {
      console.error("Failed to load user progress:", err);
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchChapters = async () => {
      await checkSubscription();
      await loadUserProgress();

      const snapshot = await getDocs(collection(db, "chapters"));
      const fetched = [];

      for (const docSnap of snapshot.docs) {
        const chapterData = docSnap.data();
        const lessonsSnap = await getDocs(collection(db, "chapters", docSnap.id, "lessons"));
        const lessons = lessonsSnap.docs.map((d, index) => ({
          ...d.data(),
          id: d.id || `lesson${index + 1}`, // Ensure each lesson has an ID
          docId: d.id, // Keep original document ID
        }));
        lessons.sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);

        fetched.push({ 
          ...chapterData, 
          lessons,
          id: chapterData.id || docSnap.id // Ensure chapter has an ID
        });
      }

      fetched.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      setChapters(fetched);
      setLoading(false);
    };

    fetchChapters();
  }, [user]);

  const isChapterLocked = (index) => {
    if (!userPlan) return true; // No plan
    if (userPlan === "basic") return index >= 5;
    return false; // pro = all unlocked
  };

  const isLessonCompleted = (chapterId, lessonId) => {
    const lessonKey = `${chapterId}-${lessonId}`;
    return userProgress.completedLessons.includes(lessonKey);
  };

  const handleLessonClick = async (lesson, chapter, lessonIndex) => {
    const chapterLocked = isChapterLocked(chapters.indexOf(chapter));
    
    if (chapterLocked) {
      console.log("Chapter is locked");
      return;
    }

    if (!lesson.videoUrl) {
      console.error("No video URL found for lesson");
      alert("Video not available for this lesson");
      return;
    }

    console.log("🎬 Starting lesson:", { lesson, chapter });

    const video = document.createElement("video");
    video.src = lesson.videoUrl;
    video.controls = true;
    video.autoplay = true;
    video.style.display = "none";
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.backgroundColor = "black";

    document.body.appendChild(video);

    try {
      await video.requestFullscreen();
      video.style.display = "block";
      await video.play();

      const handleEnded = async () => {
        console.log("🎬 Video ended, marking lesson as completed");
        
        try {
          // Generate consistent lesson ID
          const lessonId = lesson.id || lesson.docId || `lesson${lessonIndex + 1}`;
          const chapterId = chapter.id;
          
          console.log("📝 Lesson completion data:", {
            userId: user?.uid,
            lessonId,
            chapterId,
            totalLessons: chapter.lessons.length
          });
          
          const success = await markLessonCompleted(
            user?.uid, 
            lessonId, 
            chapterId, 
            chapter.lessons.length
          );

          if (success) {
            // Update local progress state
            const lessonKey = `${chapterId}-${lessonId}`;
            setUserProgress(prev => ({
              ...prev,
              completedLessons: prev.completedLessons.includes(lessonKey) 
                ? prev.completedLessons 
                : [...prev.completedLessons, lessonKey]
            }));

            // Check chapter completion
            await markChapterCompletedIfEligible(user?.uid, chapterId, chapter.lessons.length);
            
            // Reload progress to get latest data
            await loadUserProgress();
            
            console.log("✅ Lesson completion process finished successfully");
          }
          
        } catch (error) {
          console.error("❌ Failed to mark lesson as completed:", error);
          alert("Failed to save progress. Please try again.");
        }
      };

      const cleanup = () => {
        console.log("🧹 Cleaning up video element");
        video.pause();
        video.remove();
        video.removeEventListener("ended", handleEnded);
        document.removeEventListener("fullscreenchange", handleFullscreenChange);
      };

      const handleFullscreenChange = () => {
        if (!document.fullscreenElement) {
          console.log("👋 Exited fullscreen");
          cleanup();
        }
      };

      video.addEventListener("ended", handleEnded);
      document.addEventListener("fullscreenchange", handleFullscreenChange);

    } catch (err) {
      console.error("❌ Failed to enter fullscreen or play video:", err);
      video.remove();
      alert("Failed to play video. Please try again.");
    }
  };

  // Test function for debugging
  const testLessonCompletion = async () => {
    if (!user?.uid) {
      alert("Please log in first");
      return;
    }

    try {
      console.log("🧪 Testing lesson completion...");
      const success = await markLessonCompleted(user.uid, "test-lesson", "chapter1", 5);
      if (success) {
        alert("Test successful! Check console for details.");
        await loadUserProgress();
      }
    } catch (error) {
      console.error("Test failed:", error);
      alert("Test failed. Check console for details.");
    }
  };

  return loading ? (
    <Loader />
  ) : (
    <div className="relative bg-[var(--background)] text-[var(--text-color)]">
      {/* Header */}
      <div className="fixed top-0 left-0 w-full bg-[var(--background)] z-10 border-b border-[var(--card-border)]">
        <div className="p-2 max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-1">Chapters</h1>
          <p className="text-sm text-[var(--muted-text)] mb-4">Master English step by step</p>


          {/* CTA only if no active subscription */}
          {!subscription && (
            <div className="border border-[var(--card-border)] rounded-xl px-4 py-6 text-center shadow-sm mb-2 bg-[var(--card-background)]">
              <p className="text-[var(--color-primary)] font-bold mb-3 text-base">Subscribe to Start Learning</p>
              <button
                onClick={() => window.location.href = '/subscription'}
                className="bg-[var(--color-primary)] text-white font-semibold py-2 px-6 rounded-xl text-sm"
              >
                Subscribe Now
              </button>
            </div>
          )}

          {subscription && userPlan === 'basic' && (
            <div className="border border-[var(--card-border)] rounded-xl px-4 py-6 text-center shadow-sm mb-2 bg-[var(--card-background)]">
              <p className="text-[var(--color-primary)] font-bold mb-3 text-base">Unlock All Chapters with Pro Plan</p>
              <button
                onClick={() => window.location.href = '/subscription'}
                className="bg-[var(--color-primary)] text-white font-semibold py-2 px-6 rounded-xl text-sm"
              >
                Upgrade to Pro
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chapters Section */}
      <div className="pt-[250px] px-4 max-w-2xl mx-auto">
        {chapters.map((chapter, idx) => {
          const chapterLocked = isChapterLocked(idx);
          return (
            <div
              key={chapter.id || idx}
              className={`mb-6 rounded-xl border border-[var(--card-border)] shadow-sm p-4 bg-[var(--card-background)] ${chapterLocked ? 'opacity-60' : ''}`}
            >
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h2 className="font-bold text-lg text-[var(--color-primary)]">{chapter.title}</h2>
                  <p className="text-xs text-[var(--muted-text)]">
                    {chapter.lessons?.length} lessons • {chapter.duration} mins • {chapterLocked ? "Locked" : "Unlocked"}
                    {userPlan === 'basic' && idx >= 5 && (
                      <span className="ml-1 text-orange-500">(Upgrade Required)</span>
                    )}
                  </p>
                </div>
                {chapterLocked && <FaLock className="text-[var(--muted-text)] text-lg" />}
              </div>

              <div className="space-y-3">
                {chapter.lessons.map((lesson, i) => {
                  const lessonId = lesson.id || lesson.docId || `lesson${i + 1}`;
                  const isCompleted = isLessonCompleted(chapter.id, lessonId);
                  
                  return (
                    <div
                      key={lesson.docId || i}
                      className={`bg-[var(--accent)] px-4 py-3 rounded-xl ${
                        chapterLocked 
                          ? 'opacity-60 cursor-not-allowed' 
                          : 'hover:opacity-90 cursor-pointer'
                      } space-y-2 ${isCompleted ? 'border-2 border-green-500' : ''}`}
                      onClick={() => handleLessonClick(lesson, chapter, i)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 ${
                          isCompleted 
                            ? 'bg-green-500' 
                            : 'bg-[var(--color-primary)]'
                        }`}>
                          {isCompleted ? (
                            <BsCheckCircleFill className="text-white text-lg" />
                          ) : (
                            <PiNotebookDuotone className="text-white text-lg" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-color)]">
                            {lesson.title || `Lesson ${i + 1}`}
                            {isCompleted && <span className="ml-2 text-green-500 text-xs">✓ Completed</span>}
                          </p>
                          <p className="text-xs text-[var(--muted-text)] flex items-center gap-1">
                            <MdOutlineAccessTime className="inline" />
                            {lesson.duration || 15} mins
                          </p>
                        </div>
                        {chapterLocked && <FaLock className="ml-auto text-[var(--color-primary)]" />}
                      </div>
                    </div>
                  );
                })}

                {/* Chapter Exam */}
                {chapter.examEnabled && (
                  <div
                    className={`flex items-center justify-between bg-[var(--card-background)] px-4 py-3 rounded-xl border border-dashed border-[var(--card-border)] relative ${
                      chapterLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:shadow'
                    }`}
                    onClick={() => {
                      if (!chapterLocked) {
                        router.push(`/exam/chapter/${chapter.id}`);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-[#fddcd5] dark:bg-[#4c2e38] rounded-full p-2">
                        <BsCheckCircleFill className="text-[#df695a] dark:text-[#f8cfc8] text-lg" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-color)]">Chapter Exam</p>
                        <p className="text-xs text-[var(--muted-text)]">
                          {chapterLocked ? "Subscription required" : "Tap to begin"}
                        </p>
                      </div>
                    </div>
                    {chapterLocked && <FaLock className="text-[var(--color-primary)]" />}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Final Assessment */}
        <div className="mb-32">
          <h2 className="text-xl font-bold text-[var(--color-primary)] mb-2">Final Assessment</h2>
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
                  <span>•</span>
                  <span>{userPlan === 'pro' ? 'Unlocked' : 'Pro Required'}</span>
                </p>
              </div>
            </div>
            <p className="text-sm mb-3">
              {userPlan === 'pro'
                ? "Complete all chapters to unlock your final assessment and earn your certification."
                : "Upgrade to Pro plan and complete all chapters to unlock the final assessment."}
            </p>

            {/* Lock indicator */}
            {userPlan !== 'pro' && (
              <div className="absolute top-6 right-6 bg-[var(--card-background)] shadow-md px-4 py-2 rounded-xl text-center">
                <FaLock className="mx-auto mb-1 text-[var(--color-primary)]" />
                <p className="text-xs font-medium text-[var(--color-primary)]">Pro Required</p>
              </div>
            )}

            <div className="text-xs bg-[var(--accent)] text-[var(--color-primary)] px-3 py-2 rounded-lg mt-2">
              <p>
                {userPlan === 'pro'
                  ? "Complete remaining chapters to unlock the final assessment"
                  : "Upgrade to Pro plan for certification access"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Navbar />
    </div>
  );
}