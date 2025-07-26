'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '@/app/firebase/firebaseConfig';
import Loader from '@/app/components/Loader';

import {
  FiMic,
  FiStopCircle,
  FiCheckCircle,
  FiXCircle,
  FiBarChart2,
} from 'react-icons/fi';

const SECTION_ORDER = ['reading', 'writing', 'speaking', 'listening'];

export default function FinalExamPage() {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [submittedAnswers, setSubmittedAnswers] = useState({});
  const [scores, setScores] = useState({});
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const router = useRouter();

  useEffect(() => {
    const fetchExams = async () => {
      const snapshot = await getDocs(collection(db, 'final-exams'));
      const exams = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const grouped = {};
      SECTION_ORDER.forEach((type) => {
        const exam = exams.find((e) => e.type === type);
        if (exam) grouped[type] = exam;
      });

      setSections(grouped);
      setLoading(false);
    };

    fetchExams();
  }, []);

  useEffect(() => {
    if (currentSectionIndex >= SECTION_ORDER.length) {
      const timeout = setTimeout(() => {
        router.push('/dashboard');
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [currentSectionIndex]);

  const currentType = SECTION_ORDER[currentSectionIndex];
  const exam = sections[currentType];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob);

        const res = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        setSubmittedAnswers((prev) => ({ ...prev, speaking: data.text }));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
    } catch (err) {
      alert('Microphone access denied or error starting recording.');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    } else {
      console.warn('No active media recorder to stop');
    }
  };

  const handleSubmit = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return alert('Login first!');

    let score = 0;

    if (exam.type === 'reading' || exam.type === 'listening') {
      const correct = exam.questions?.[0]?.correctAnswer;
      const userAnswer = submittedAnswers[exam.type];
      if (userAnswer !== undefined) score = userAnswer === correct ? 10 : 0;
    }

    if (exam.type === 'writing' || exam.type === 'speaking') {
      const response = submittedAnswers[exam.type];
      const questionText =
        exam.type === 'writing'
          ? exam.questions?.[0]?.question
          : exam.topics?.[0]?.topic;

      if (response && questionText) {
        const aiRes = await fetch('/api/chat', {
          method: 'POST',
          body: JSON.stringify({
            messages: [
              {
                role: 'user',
                text: `Evaluate the following IELTS ${exam.type} answer based on the given question. Rate it out of 10 and explain briefly.\n\nQuestion: "${questionText}"\nAnswer: "${response}"`,
              },
            ],
          }),
        });

        const data = await aiRes.json();
        const reply = data.reply || '';
        const scoreMatch = reply.match(/(\d+(\.\d+)?)(?=\s*\/\s*10)/);
        score = scoreMatch ? Math.round(parseFloat(scoreMatch[1])) : 5;
      }
    }

    const updatedScores = { ...scores, [exam.type]: score };
    setScores(updatedScores);

    const resultRef = doc(db, `users/${user.uid}/final-exam`, 'result');
    await setDoc(resultRef, {
      ...updatedScores,
      submittedAt: new Date(),
    });

    if (currentSectionIndex < SECTION_ORDER.length - 1) {
      setCurrentSectionIndex((prev) => prev + 1);
    } else {
      setCurrentSectionIndex(SECTION_ORDER.length); // show result
    }
  };

  if (loading) return <Loader />;
  if (!exam && currentSectionIndex < SECTION_ORDER.length)
    return <p className="text-center text-red-500">No exam data found.</p>;

  if (currentSectionIndex >= SECTION_ORDER.length) {
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    const passed = total >= 24;
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-4 flex items-center justify-center gap-2">
          <FiBarChart2 /> Final Exam Result
        </h2>
        <div className="mt-4 space-y-2">
          {SECTION_ORDER.map((type) => (
            <p key={type} className="text-sm">
              <strong>{type.toUpperCase()}:</strong> {scores[type] || 0} / 10
            </p>
          ))}
        </div>
        <div className={`mt-6 text-xl font-bold flex items-center justify-center gap-2 ${passed ? 'text-green-600' : 'text-red-500'}`}>
          {passed ? <><FiCheckCircle /> Passed</> : <><FiXCircle /> Failed</>}
        </div>
        <p className="text-xs text-gray-400 mt-2">Redirecting to dashboard...</p>
      </div>
    );
  }
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-primary)]">{exam.title}</h1>
      <p className="text-sm text-[var(--muted-text)]">{exam.instructions}</p>
      {exam.type === 'reading' && (
        <>
          <div className="bg-[var(--accent)] p-3 rounded-xl text-sm mb-4">
            <strong>Passage:</strong> {exam.passage}
          </div>
          {exam.questions?.[0] && (
            <div>
              <p className="font-medium mb-1">1. {exam.questions[0].question}</p>
              {exam.questions[0].options.map((opt, i) => (
                <label key={i} className="block text-sm">
                  <input
                    type="radio"
                    name="reading"
                    className="mr-2"
                    onChange={() =>
                      setSubmittedAnswers({ ...submittedAnswers, reading: i })
                    }
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}
        </>
      )}
      {exam.type === 'writing' && (
  <div className="space-y-4">
    {exam.questions?.[0]?.imageUrl && (
      <div className="w-full flex justify-center">
        <img
          src={exam.questions[0].imageUrl}
          alt="Writing prompt"
          className="rounded-xl max-w-full max-h-64 object-contain"
        />
      </div>
    )}
    <p className="font-medium">1. {exam.questions?.[0]?.question}</p>
    <textarea
      rows={4}
      placeholder={`Write between ${exam.questions[0].minWords} - ${exam.questions[0].maxWords} words...`}
      className="w-full border rounded-xl p-2 text-sm"
      onChange={(e) =>
        setSubmittedAnswers({ ...submittedAnswers, writing: e.target.value })
      }
    />
  </div>
)}
      {exam.type === 'speaking' && (
        <div>
          <p className="font-medium">1. {exam.topics?.[0]?.topic}</p>
          <p className="text-sm text-[var(--muted-text)]">{exam.topics?.[0]?.instructions}</p>
          {recording ? (
            <button
              onClick={stopRecording}
              className="mt-2 w-full bg-red-600 text-white py-2 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <FiStopCircle /> Stop Recording
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="mt-2 w-full bg-[var(--color-primary)] text-white py-2 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <FiMic /> Record Answer
            </button>
          )}

          <p className="text-xs text-gray-500 mt-2">
            {submittedAnswers.speaking
              ? `Transcribed: ${submittedAnswers.speaking}`
              : 'No response recorded yet.'}
          </p>
        </div>
      )}
      {exam.type === 'listening' && (
        <>
          <audio controls className="w-full mb-4">
            <source src={exam.audioUrl} type="audio/mpeg" />
          </audio>
          {exam.questions?.[0] && (
            <div>
              <p className="font-medium mb-1">1. {exam.questions[0].question}</p>
              {exam.questions[0].options.map((opt, i) => (
                <label key={i} className="block text-sm">
                  <input
                    type="radio"
                    name="listening"
                    className="mr-2"
                    onChange={() =>
                      setSubmittedAnswers({ ...submittedAnswers, listening: i })
                    }
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}
        </>
      )}
      <button
        onClick={handleSubmit}
        className="mt-4 w-full px-6 py-2 bg-[var(--color-primary)] text-white rounded-xl font-semibold"
      >
        {currentSectionIndex === SECTION_ORDER.length - 1 ? 'Submit Final' : 'Next'}
      </button>
    </div>
  );
}