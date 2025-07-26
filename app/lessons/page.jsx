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
  const [finalExams, setFinalExams] = useState([]);

  const [userProgress, setUserProgress] = useState({
    completedLessons: [],
    completedExams: [],
    completedChapters: []
  });
  const router = useRouter();

  const checkSubscription = async () => {
  if (!user?.uid) return;
  try {
    const docRef = doc(db, "users", user.uid, "subscriptions", "details"); // ✅ fixed path
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const now = new Date();
      if (data.status === "active" && new Date(data.endDate) > now) {
        setSubscription(data);
        setUserPlan(data.plan); // ✅ use `data.plan`, not `planType`
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
  // Normalize completedLessons array
  const normalizedLessons = progress.completedLessons?.map((item) =>
    typeof item === 'string' ? { key: item, completedAt: null } : item
  ) || [];

  setUserProgress({
  ...progress,
  completedLessons: normalizedLessons,
  completedChapters: progress.completedChapters || [],
  completedExams: progress.completedExams || [],
});


  console.log("📊 User progress loaded:", normalizedLessons);
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

  // 🔹 Fetch Chapters
  const snapshot = await getDocs(collection(db, "chapters"));
  const fetched = [];

  for (const docSnap of snapshot.docs) {
    const chapterData = docSnap.data();
    const lessonsSnap = await getDocs(collection(db, "chapters", docSnap.id, "lessons"));
    const lessons = lessonsSnap.docs.map((d, index) => ({
      ...d.data(),
      id: d.id || `lesson${index + 1}`,
      docId: d.id,
    }));
    lessons.sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);

    fetched.push({ 
      ...chapterData, 
      lessons,
      id: chapterData.id || docSnap.id
    });
  }

  fetched.sort((a, b) => parseInt(a.id) - parseInt(b.id));
  setChapters(fetched);

  // 🔹 Fetch Final Exams here (inside this function)
  try {
    const examsSnap = await getDocs(collection(db, "final-exams")); // if it's actually "final-exams"

    const exams = examsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setFinalExams(exams);
  } catch (err) {
    console.error("Failed to load final exams:", err);
  }

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
  return userProgress.completedLessons.some(
    (item) => typeof item === 'object' && item.key === lessonKey
  );
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
    const lessonId = lesson.id || lesson.docId || `lesson${lessonIndex + 1}`;
    const chapterId = chapter.id;
    const lessonKey = `${chapterId}-${lessonId}`;

    const success = await markLessonCompleted(
      user?.uid,
      lessonId,
      chapterId,
      chapter.lessons.length
    );

    if (success) {
      // ✅ Correct way to store in local state
      setUserProgress(prev => ({
        ...prev,
        completedLessons: prev.completedLessons.some(item => item.key === lessonKey)
          ? prev.completedLessons
          : [...prev.completedLessons, { key: lessonKey, completedAt: new Date().toISOString() }]
      }));

      // ✅ Check and update chapter completion
      await markChapterCompletedIfEligible(user?.uid, chapterId, chapter.lessons.length);

      // ✅ Refresh progress from Firestore
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

    {/* Subscription CTA Section - shown only if needed */}
    {(!subscription || userPlan === 'basic') && (
      <div className="space-y-4 mt-4">
        {!subscription && (
          <div className="border border-[var(--card-border)] rounded-xl px-4 py-6 text-center shadow-sm bg-[var(--card-background)]">
            <p className="text-[var(--color-primary)] font-bold mb-3 text-base">Subscribe to Start Learning</p>
            <button
              onClick={() => router.push('/subscription')}
              className="bg-[var(--color-primary)] text-white font-semibold py-2 px-6 rounded-xl text-sm"
            >
              Subscribe Now
            </button>
          </div>
        )}

        {subscription && userPlan === 'basic' && (
          <div className="border border-[var(--card-border)] rounded-xl px-4 py-6 text-center shadow-sm bg-[var(--card-background)]">
            <p className="text-[var(--color-primary)] font-bold mb-3 text-base">Unlock All Chapters with Pro Plan</p>
            <button
              onClick={() => router.push('/subscription')}
              className="bg-[var(--color-primary)] text-white font-semibold py-2 px-6 rounded-xl text-sm"
            >
              Upgrade to Pro
            </button>
          </div>
        )}
      </div>
    )}
  </div>
</div>



      {/* Chapters Section */}
      <div className={`px-4 max-w-2xl mx-auto ${(!subscription || userPlan === 'basic') ? 'pt-[250px]' : 'pt-[140px]'}`}>
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
  className={`rounded-xl px-4 py-3 transition
    ${chapterLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--card-hover)]'}
    border border-[var(--card-border)] bg-[var(--card-background)]
  `}
  onClick={() => !chapterLocked && handleLessonClick(lesson, chapter, i)}
>
  <div className="flex items-center gap-3">
    {/* Icon */}
    <div
      className="rounded-full p-2 flex items-center justify-center bg-[var(--color-primary)]"
    >
      <PiNotebookDuotone className="text-white text-lg" />
    </div>

    {/* Title & Duration */}
    <div className="flex-1">
      <p className="text-sm font-medium text-[var(--text-color)] flex items-center gap-2">
        {lesson.title || `Lesson ${i + 1}`}
        {isCompleted && (
          <span className="text-xs text-[var(--color-primary)] font-medium">
            ✓ Completed
          </span>
        )}
      </p>
      <p className="text-xs text-[var(--muted-text)] flex items-center gap-1">
        <MdOutlineAccessTime className="inline" />
        {lesson.duration || 15} mins
      </p>
    </div>

    {/* Lock Icon (if chapter is locked) */}
    {chapterLocked && (
      <FaLock className="text-[var(--muted-text)] text-sm" />
    )}
  </div>
</div>


                  );
                })}

                {/* Chapter Exam */}
                {chapter.examEnabled && (
  <div
    className={`flex items-center justify-between px-4 py-3 rounded-xl border relative transition-all ${
      chapterLocked
        ? "cursor-not-allowed opacity-50 bg-[var(--card-background)] border-[var(--card-border)]"
        : "bg-[var(--card-background)] border-[var(--card-border)] hover:shadow"
    }`}
    onClick={() => {
      if (!chapterLocked && !(userProgress.completedExams || []).includes(chapter.id)) {
        router.push(`/exam/chapter/${chapter.id}`);
      }
    }}
  >
    <div className="flex items-center gap-3">
      <div className={`rounded-full p-2 ${
        (userProgress.completedExams || []).includes(chapter.id)
          ? "bg-[var(--color-primary)]"
          : "bg-[#fddcd5] dark:bg-[#4c2e38]"
      }`}>
        <BsCheckCircleFill
          className={`text-lg ${
            (userProgress.completedExams || []).includes(chapter.id)
              ? "text-white"
              : "text-[#df695a] dark:text-[#f8cfc8]"
          }`}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-[var(--text-color)]">
          Chapter Exam
          {(userProgress.completedExams || []).includes(chapter.id) && (
            <span className="ml-2 text-[var(--color-primary)] text-xs">✓ Completed</span>
          )}
        </p>
        <p className="text-xs text-[var(--muted-text)]">
          {chapterLocked
            ? "Subscription required"
            : (userProgress.completedExams || []).includes(chapter.id)
            ? "Already completed"
            : "Tap to begin"}
        </p>
      </div>
    </div>

    {(chapterLocked || (userProgress.completedExams || []).includes(chapter.id)) && (
      <FaLock className="text-[var(--color-primary)] ml-2" />
    )}
  </div>
)}


              </div>
            </div>
          );
        })}

        {/* Final Assessment */}
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
          <span>{userPlan === 'pro' ? 'Unlocked' : 'Pro Required'}</span>
        </p>
      </div>
    </div>

    <p className="text-xs bg-[var(--accent)] text-[var(--color-primary)] px-3 py-2 rounded-lg mt-2 mb-4">
  {userPlan === 'pro'
    ? `Completed ${(userProgress.completedChapters || []).length} of ${chapters.length} chapters`
    : "Upgrade to Pro plan for certification access"}
</p>



    {/* Lock indicator */}
    {userPlan !== 'pro' && (
      <div className="absolute top-6 right-6 bg-[var(--card-background)] shadow-md px-4 py-2 rounded-xl text-center">
        <FaLock className="mx-auto mb-1 text-[var(--color-primary)]" />
        <p className="text-xs font-medium text-[var(--color-primary)]">Pro Required</p>
      </div>
    )}


    {/* Final Exam Button */}
    <button
  disabled={
    userPlan !== 'pro' ||
    (userProgress.completedChapters || []).length !== chapters.length ||
    finalExams.length === 0
  }
  onClick={() => {
    if (finalExams.length > 0) {
      router.push(`/exam/final/${finalExams[0].id}`);
    }
  }}
  className={`w-full py-2 text-sm font-semibold rounded-xl transition ${
    userPlan !== 'pro' ||
    (userProgress.completedChapters || []).length !== chapters.length ||
    finalExams.length === 0
      ? "bg-gray-400 text-white cursor-not-allowed"
      : "bg-[var(--color-primary)] text-white hover:opacity-90"
  }`}
>
  {userPlan !== 'pro'
    ? "Pro Required"
    : (userProgress.completedChapters || []).length !== chapters.length
    ? "Complete All Chapters to Unlock"
    : finalExams.length === 0
    ? "No Exam Found"
    : "Start Final Assessment"}
</button>


  </div>
</div>

      </div>

      <Navbar />
    </div>
  );
}