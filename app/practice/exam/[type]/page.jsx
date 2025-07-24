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
      // ✅ Update XP in Firestore
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
      const correctIndex = exam.questions[i].correctAnswer; // e.g., 0, 1, 2, 3
      const selectedAnswer = answers[i]; // selected option text
      const correctAnswerText = exam.questions[i].options[correctIndex]; // correct option text

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




  if (loading) return <div className="p-6">Loading exam...</div>;
  if (!exam) return <div className="p-6">No exam found for "{type}"</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button
  onClick={() => router.back()}
  className="flex items-center gap-2 mb-4 text-sm text-[var(--color-primary)] font-medium"
>
  <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center">
    <HiOutlineArrowLeft className="text-[var(--color-primary)] text-lg" />
  </div>
</button>


      <h1 className="text-2xl font-bold mt-2 capitalize text-[var(--color-primary-dark)]">
        {exam.title}
      </h1>

      {/* SPEAKING */}
      {type === "speaking" && (
        <div className="mt-6 flex flex-col justify-between px-2 pb-4">
          <div className="bg-[#f9f5fa] rounded-xl p-4 shadow mb-6">
            <h2 className="flex items-center text-lg font-semibold text-[var(--color-primary-dark)] mb-2">
              <FaMicrophone className="mr-2 text-[var(--color-primary)]" />
              Speaking Prompt
            </h2>
            <p className="text-md font-medium mb-3">{exam.topics?.[0]?.topic}</p>
            <div className="bg-white p-3 rounded-lg text-sm text-gray-600">
              <p><strong>Intro (30 sec):</strong> Name, origin, opinion (e.g., "Technology helps students.")</p>
              <p><strong>Main (2–3 min):</strong> 2–3 benefits (e.g., online learning, research, communication) + examples.</p>
              <p><strong>End (30 sec):</strong> Recap (e.g., "It improves studying.") + final thought.</p>
              <p className="mt-2"><strong>Tips:</strong> Clear, simple, on-topic.</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`w-16 h-16 rounded-full shadow-md flex items-center justify-center text-2xl ${
                isRecording ? "bg-red-600" : "bg-[var(--color-primary)]"
              } text-white`}
              aria-label="Toggle Recording"
            >
              <FaMicrophone />
            </button>

            <button
              onClick={handleSubmit}
              className="w-full bg-[var(--color-primary)] text-white text-lg py-3 rounded-xl shadow mt-2"
            >
              Submit
            </button>
            {evaluationResult && (
  <div className="mt-6 bg-white p-4 rounded-xl shadow text-center">
    <h3 className="text-lg font-bold text-[var(--color-primary-dark)]">Result</h3>
    <p
      className={`mt-2 text-2xl font-bold ${
        evaluationResult.result === "PASS" ? "text-green-600" : "text-red-500"
      }`}
    >
      {evaluationResult.result}
    </p>

    <div className="mt-4 text-sm text-gray-500">
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
        <div key={i} className="bg-[#f9f5fa] rounded-xl p-4 shadow">
          <h2 className="text-xl font-semibold text-[var(--color-primary-dark)] flex items-center gap-2 mb-4">
            ✏️ Writing Practice
          </h2>

          <img
            src={q.imageUrl}
            alt="writing"
            className="w-full h-40 object-contain rounded-md mb-4"
          />

          <p className="text-md font-medium text-gray-800 mb-3">{q.question}</p>

          <p className="text-sm text-gray-500 mb-1">
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
            className="w-full min-h-[150px] border border-gray-300 p-3 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
      );
    })}

    {/* ✅ Final Submit All Answers Button */}
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
            ? "bg-[var(--color-primary)]"
            : "bg-gray-300 cursor-not-allowed"
        }`}
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
              i === currentQuestion ? "bg-[var(--color-primary)]" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>

    {/* Header */}
    <h1 className="text-xl font-semibold text-center text-[var(--color-primary-dark)] flex items-center justify-center gap-2">
      📖 Reading Practice
    </h1>

    {/* Show Passage First */}
    {!showQuestions && (
      <>
        <div className="bg-[#f9f5fa] p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold text-[var(--color-primary-dark)] mb-3">
            Reading Passage
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {exam.passage}
          </p>
        </div>

        <button
          onClick={() => setShowQuestions(true)}
          className="bg-white border border-[var(--color-primary-light)] text-[var(--color-primary)] font-medium py-3 px-4 rounded-xl shadow flex items-center justify-center gap-2"
        >
          <span className="text-xl">❓</span> View Questions
        </button>
      </>
    )}

    {/* Question by Question UI */}
    {showQuestions && (
      <div className="space-y-4">
        {/* Current Question Card */}
        <div className="bg-white p-5 rounded-xl shadow-md">
          <p className="text-base font-medium text-gray-800 mb-4">
            Q{currentQuestion + 1}. {exam.questions[currentQuestion].question}
          </p>

          <div className="space-y-3">
            {exam.questions[currentQuestion].options.map((opt, idx) => (
              <label
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg bg-[#f9f9f9] border border-gray-200"
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
                <span className="text-sm text-gray-700">{opt}</span>
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
                ? "bg-gray-200 text-gray-500"
                : "bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]"
            }`}
          >
            ← Previous
          </button>

          {currentQuestion < exam.questions.length - 1 ? (
            <button
              onClick={() =>
                setCurrentQuestion((prev) => Math.min(exam.questions.length - 1, prev + 1))
              }
              className="px-4 py-2 text-sm rounded-xl bg-[var(--color-primary)] text-white"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleReadingSubmit}
              className="px-6 py-2 text-sm rounded-xl bg-[var(--color-primary)] text-white"
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
    <h2 className="text-xl font-semibold text-[var(--color-primary-dark)] flex items-center gap-2">
      <FaMicrophone className="text-[var(--color-primary)]" />
      Listening Assessment
    </h2>

    <div className="bg-[#f9f5fa] rounded-xl p-6 shadow text-center">
      <h3 className="text-lg font-semibold text-[var(--color-primary-dark)] mb-2">
        🎧 Listening Comprehension Test
      </h3>
      <p className="text-sm text-gray-600 mb-4">
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
      <div className="bg-white rounded-xl shadow p-4">
        <p className="font-medium text-[var(--color-primary-dark)] mb-2">
          Q{currentQuestion + 1}. {exam.questions[currentQuestion]?.question}
        </p>
        <ul className="space-y-2 text-gray-700">
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
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-[var(--color-primary)]"
            }`}
          >
            Previous
          </button>

          {currentQuestion < exam.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestion((prev) => prev + 1)}
              className="px-4 py-2 rounded-xl text-white text-sm bg-[var(--color-primary)]"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleListeningSubmit}
              className="px-4 py-2 rounded-xl text-white text-sm bg-[var(--color-primary)]"
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
