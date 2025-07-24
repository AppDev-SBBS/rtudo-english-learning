"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDocs, collection, query, where, addDoc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/app/firebase/firebaseConfig";
import { getAuth } from "firebase/auth";
import Link from "next/link";
import { FaMicrophone } from "react-icons/fa";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { updateXP } from "@/app/utils/updateXP";

export default function ExamPage() {
  const { type } = useParams();
  const router = useRouter();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [showQuestions, setShowQuestions] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [writingAnswers, setWritingAnswers] = useState([]);
  const [evaluationResult, setEvaluationResult] = useState(null);

  const chunksRef = useRef([]);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const q = query(collection(db, "practice-exams"), where("type", "==", type));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setExam(snapshot.docs[0].data());
        }
      } catch (err) {
        console.error("Failed to fetch exam:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [type]);

  const handleStartRecording = async () => {
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => setRecordedChunks(chunksRef.current);

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access denied or not supported.");
    }
  };

  const handleStopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
  };

  const handleSubmit = async () => {
    if (recordedChunks.length === 0) {
      alert("Please record your response first.");
      return;
    }

    const audioBlob = new Blob(recordedChunks, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audio", audioBlob, "response.webm");

    try {
      const res = await fetch("/api/evaluate-speaking", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("Evaluation Result:", data);
      setEvaluationResult(data);

      const auth = getAuth();
      const user = auth.currentUser;

      if (data.result === "PASS") {
        await updateXP(user.uid, 15, "speaking");
        alert("✅ You passed! 15 XP added.");
      } else {
        alert("❌ You did not pass. Try again later.");
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch (err) {
      console.error("Evaluation failed:", err);
      alert("Evaluation failed. Please try again.");
    }
  };

  const handleWritingSubmit = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return alert("Please login first");

    try {
      const results = [];

      for (const answer of writingAnswers) {
        const res = await fetch("/api/evaluate-writing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: answer }),
        });

        const data = await res.json();
        results.push(data.result);
      }

      const passedAll = results.every((r) => r === "PASS");

      if (passedAll) {
        await updateXP(user.uid, 15, "writing");
        alert("✅ All answers passed! 15 XP added.");
      } else {
        alert("❌ Some answers failed. Try again later.");
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Evaluation failed:", err);
      alert("Submit failed.");
    }
  };

  const handleListeningSubmit = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return alert("Please login first");

    try {
      const totalQuestions = exam.questions.length;
      let correctCount = 0;

      for (let i = 0; i < totalQuestions; i++) {
        const correctIndex = exam.questions[i].correctAnswer;
        const selectedAnswer = answers[i];
        const correctAnswerText = exam.questions[i].options[correctIndex];

        if (selectedAnswer === correctAnswerText) {
          correctCount++;
        }
      }

      const passed = correctCount / totalQuestions >= 0.5;

      if (passed) {
        await updateXP(user.uid, 15, "listening");
        alert("✅ You passed! 15 XP added.");
      } else {
        alert("❌ Less than 50% correct. Try again later.");
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Listening submit failed:", err);
      alert("Submission failed.");
    }
  };

  const handleReadingSubmit = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return alert("Please login first");

    try {
      const totalQuestions = exam.questions.length;
      let correctCount = 0;

      for (let i = 0; i < totalQuestions; i++) {
        const correctIndex = exam.questions[i].correctAnswer;
        const selectedAnswer = answers[i];
        const correctAnswerText = exam.questions[i].options[correctIndex];

        if (selectedAnswer === correctAnswerText) {
          correctCount++;
        }
      }

      const passed = correctCount / totalQuestions >= 0.5;

      if (passed) {
        await updateXP(user.uid, 15, "reading");
        alert("✅ You passed! 15 XP added.");
      } else {
        alert("❌ Less than 50% correct. Try again later.");
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Reading submit failed:", err);
      alert("Submission failed.");
    }
  };

  if (loading) return <div className="p-6" style={{ color: 'var(--text-color)' }}>Loading exam...</div>;
  if (!exam) return <div className="p-6" style={{ color: 'var(--text-color)' }}>No exam found for "{type}"</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 mb-4 text-sm font-medium"
        style={{ color: 'var(--color-primary)' }}
      >
        <div className="w-8 h-8 rounded-full border flex items-center justify-center"
             style={{ borderColor: 'var(--card-border)' }}>
          <HiOutlineArrowLeft className="text-lg" style={{ color: 'var(--color-primary)' }} />
        </div>
      </button>

      <h1 className="text-2xl font-bold mt-2 capitalize" style={{ color: 'var(--color-primary)' }}>
        {exam.title}
      </h1>

      {/* SPEAKING */}
      {type === "speaking" && (
        <div className="mt-6 flex flex-col justify-between px-2 pb-4">
          <div className="accent-bg rounded-xl p-4 shadow mb-6">
            <h2 className="flex items-center text-lg font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>
              <FaMicrophone className="mr-2" style={{ color: 'var(--color-primary)' }} />
              Speaking Prompt
            </h2>
            <p className="text-md font-medium mb-3" style={{ color: 'var(--text-color)' }}>
              {exam.topics?.[0]?.topic}
            </p>
            <div className="card p-3 rounded-lg text-sm muted-text">
              <p><strong>Intro (30 sec):</strong> Name, origin, opinion (e.g., "Technology helps students.")</p>
              <p><strong>Main (2–3 min):</strong> 2–3 benefits (e.g., online learning, research, communication) + examples.</p>
              <p><strong>End (30 sec):</strong> Recap (e.g., "It improves studying.") + final thought.</p>
              <p className="mt-2"><strong>Tips:</strong> Clear, simple, on-topic.</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`w-16 h-16 rounded-full shadow-md flex items-center justify-center text-2xl text-white ${
                isRecording ? "bg-red-600" : ""
              }`}
              style={{ backgroundColor: isRecording ? undefined : 'var(--color-primary)' }}
              aria-label="Toggle Recording"
            >
              <FaMicrophone />
            </button>

            <button
              onClick={handleSubmit}
              className="w-full text-white text-lg py-3 rounded-xl shadow mt-2"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Submit
            </button>

            {evaluationResult && (
              <div className="mt-6 card p-4 rounded-xl shadow text-center">
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>Result</h3>
                <p
                  className={`mt-2 text-2xl font-bold ${
                    evaluationResult.result === "PASS" ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
                  }`}
                >
                  {evaluationResult.result}
                </p>

                <div className="mt-4 text-sm muted-text">
                  <h4 className="font-semibold mb-1">Transcript:</h4>
                  <p className="whitespace-pre-wrap">{evaluationResult.transcript}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WRITING */}
      {type === "writing" && (
        <div className="mt-4 space-y-6">
          {exam.questions?.map((q, i) => {
            const answer = writingAnswers[i] || "";
            const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;

            return (
              <div key={i} className="accent-bg rounded-xl p-4 shadow">
                <h2 className="text-xl font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--color-primary)' }}>
                  ✏️ Writing Practice
                </h2>

                <img
                  src={q.imageUrl}
                  alt="writing"
                  className="w-full h-40 object-contain rounded-md mb-4"
                />

                <p className="text-md font-medium mb-3" style={{ color: 'var(--text-color)' }}>
                  {q.question}
                </p>

                <p className="text-sm muted-text mb-1">
                  📝 {wordCount} / {q.minWords} words minimum
                </p>

                <textarea
                  value={answer}
                  onChange={(e) => {
                    const updated = [...writingAnswers];
                    updated[i] = e.target.value;
                    setWritingAnswers(updated);
                  }}
                  placeholder="Write your answer here..."
                  className="w-full min-h-[150px] border p-3 rounded-lg text-sm focus:outline-none focus:ring-2 card"
                  style={{ 
                    borderColor: 'var(--card-border)',
                    focusRingColor: 'var(--color-primary)'
                  }}
                />
              </div>
            );
          })}

          <div className="text-center">
            <button
              onClick={handleWritingSubmit}
              disabled={exam.questions?.some((q, i) => {
                const ans = writingAnswers[i] || "";
                const wordCount = ans.trim().split(/\s+/).filter(Boolean).length;
                return wordCount < q.minWords;
              })}
              className={`mt-6 w-full py-3 rounded-xl text-white text-lg shadow ${
                exam.questions?.every((q, i) => {
                  const ans = writingAnswers[i] || "";
                  const wordCount = ans.trim().split(/\s+/).filter(Boolean).length;
                  return wordCount >= q.minWords;
                })
                  ? ""
                  : "bg-gray-300 cursor-not-allowed"
              }`}
              style={{ 
                backgroundColor: exam.questions?.every((q, i) => {
                  const ans = writingAnswers[i] || "";
                  const wordCount = ans.trim().split(/\s+/).filter(Boolean).length;
                  return wordCount >= q.minWords;
                }) ? 'var(--color-primary)' : undefined
              }}
            >
              Submit 
            </button>
          </div>
        </div>
      )}

      {/* READING */}
      {type === "reading" && (
        <div className="mt-6 flex flex-col px-4 pb-6 space-y-6 max-w-2xl mx-auto">
          {/* Progress Dots */}
          <div className="flex justify-center">
            <div className="flex gap-1">
              {exam.questions?.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i === currentQuestion ? "" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                  style={{ backgroundColor: i === currentQuestion ? 'var(--color-primary)' : undefined }}
                />
              ))}
            </div>
          </div>

          {/* Header */}
          <h1 className="text-xl font-semibold text-center flex items-center justify-center gap-2"
              style={{ color: 'var(--color-primary)' }}>
            📖 Reading Practice
          </h1>

          {/* Show Passage First */}
          {!showQuestions && (
            <>
              <div className="accent-bg p-4 rounded-xl shadow">
                <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
                  Reading Passage
                </h2>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-color)' }}>
                  {exam.passage}
                </p>
              </div>

              <button
                onClick={() => setShowQuestions(true)}
                className="card border font-medium py-3 px-4 rounded-xl shadow flex items-center justify-center gap-2"
                style={{ 
                  borderColor: 'var(--color-primary)',
                  color: 'var(--color-primary)'
                }}
              >
                <span className="text-xl">❓</span> View Questions
              </button>
            </>
          )}

          {/* Question by Question UI */}
          {showQuestions && (
            <div className="space-y-4">
              {/* Current Question Card */}
              <div className="card p-5 rounded-xl shadow-md">
                <p className="text-base font-medium mb-4" style={{ color: 'var(--text-color)' }}>
                  Q{currentQuestion + 1}. {exam.questions[currentQuestion].question}
                </p>

                <div className="space-y-3">
                  {exam.questions[currentQuestion].options.map((opt, idx) => (
                    <label
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-lg accent-bg border"
                      style={{ borderColor: 'var(--card-border)' }}
                    >
                      <input
                        type="radio"
                        name={`reading-q${currentQuestion}`}
                        value={opt}
                        checked={answers[currentQuestion] === opt}
                        onChange={() => {
                          const updated = [...answers];
                          updated[currentQuestion] = opt;
                          setAnswers(updated);
                        }}
                      />
                      <span className="text-sm" style={{ color: 'var(--text-color)' }}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-4">
                <button
                  onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestion === 0}
                  className={`px-4 py-2 text-sm rounded-xl ${
                    currentQuestion === 0
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      : "accent-bg"
                  }`}
                  style={{ 
                    color: currentQuestion === 0 ? undefined : 'var(--color-primary)'
                  }}
                >
                  ← Previous
                </button>

                {currentQuestion < exam.questions.length - 1 ? (
                  <button
                    onClick={() =>
                      setCurrentQuestion((prev) => Math.min(exam.questions.length - 1, prev + 1))
                    }
                    className="px-4 py-2 text-sm rounded-xl text-white"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={handleReadingSubmit}
                    className="px-6 py-2 text-sm rounded-xl text-white"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    Submit
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* LISTENING */}
      {type === "listening" && (
        <div className="mt-4 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
            <FaMicrophone style={{ color: 'var(--color-primary)' }} />
            Listening Assessment
          </h2>

          <div className="accent-bg rounded-xl p-6 shadow text-center">
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-primary)' }}>
              🎧 Listening Comprehension Test
            </h3>
            <p className="text-sm muted-text mb-4">
              Listen carefully to the audio. The questions will be displayed after you finish listening.
            </p>

            <audio
              controls
              onEnded={() => {
                setShowQuestions(true);
                setAnswers(new Array(exam.questions.length).fill(""));
              }}
              className="w-full max-w-md mx-auto"
            >
              <source src={exam.audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>

          {/* Show one question at a time after audio ends */}
          {showQuestions && (
            <div className="card rounded-xl shadow p-4">
              <p className="font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
                Q{currentQuestion + 1}. {exam.questions[currentQuestion]?.question}
              </p>
              <ul className="space-y-2" style={{ color: 'var(--text-color)' }}>
                {exam.questions[currentQuestion]?.options.map((opt, idx) => (
                  <li key={idx}>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`q${currentQuestion}`}
                        value={opt}
                        checked={answers[currentQuestion] === opt}
                        onChange={() => {
                          const updated = [...answers];
                          updated[currentQuestion] = opt;
                          setAnswers(updated);
                        }}
                      />
                      {opt}
                    </label>
                  </li>
                ))}
              </ul>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                <button
                  disabled={currentQuestion === 0}
                  onClick={() => setCurrentQuestion((prev) => prev - 1)}
                  className={`px-4 py-2 rounded-xl text-white text-sm ${
                    currentQuestion === 0
                      ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                      : ""
                  }`}
                  style={{ 
                    backgroundColor: currentQuestion === 0 ? undefined : 'var(--color-primary)'
                  }}
                >
                  Previous
                </button>

                {currentQuestion < exam.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestion((prev) => prev + 1)}
                    className="px-4 py-2 rounded-xl text-white text-sm"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleListeningSubmit}
                    className="px-4 py-2 rounded-xl text-white text-sm"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    Submit
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}