"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { MdArrowBack, MdAccessTime } from "react-icons/md";
import { FaStar, FaMicrophone } from "react-icons/fa6";

export default function InterviewPage() {
  const router = useRouter();
  const bottomRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState([]);
  const hasGreetedRef = useRef(false);

  const SpeechRecognition =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  // Greet once on mount
  useEffect(() => {
    const greet = () => {
      if (!hasGreetedRef.current) {
        hasGreetedRef.current = true;
        const introText = `Hello, I am your interview assistant. What would you like to practice?\n1. Job Interview\n2. Academic Interview\n3. General Interview`;
        const aiMessage = {
          role: "assistant",
          text: introText,
          timestamp: getCurrentTime(),
        };
        setMessages([aiMessage]);
        speakText(introText);
      }
    };

    greet();
  }, []);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set up mic recognition
  useEffect(() => {
    if (!recognition) return;

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setListening(false);
      await handleVoiceInput(transcript);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
  }, [recognition]);

  const handleMicClick = () => {
    if (!recognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    if (listening) {
      recognition.stop();
    } else {
      recognition.start();
      setListening(true);
    }
  };

  const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    speechSynthesis.speak(utterance);
  };

  const getCurrentTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleVoiceInput = async (transcript) => {
    const userMsg = {
      role: "user",
      text: transcript,
      timestamp: getCurrentTime(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
        }),
      });

      const data = await res.json();

      const aiMsg = {
        role: "assistant",
        text: data.reply,
        timestamp: getCurrentTime(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      speakText(data.reply);
    } catch (error) {
      const errorMsg = {
        role: "assistant",
        text: "Sorry, I couldn't respond. Please try again.",
        timestamp: getCurrentTime(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      speakText(errorMsg.text);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans flex flex-col items-center relative">
      {/* Header */}
      <div className="fixed top-0 left-0 w-full bg-white z-10 border-b shadow-sm">
        <div className="px-4 py-4 max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()}>
            <MdArrowBack size={24} />
          </button>
          <h1 className="font-semibold text-lg">Interview Mode</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
              <FaStar className="mr-1" /> 1738 XP
            </div>
            <MdAccessTime size={22} />
          </div>
        </div>
      </div>

      {/* AI Intro Section */}
      <div className="pt-28 px-4 w-full max-w-3xl">
        {messages.length > 0 && (
          <div className="w-full text-center rounded-3xl py-16 px-6 bg-gradient-to-b from-[#e8cce2] to-white">
            <h2 className="text-xl font-semibold text-gray-900 mb-3 whitespace-pre-line">
              Hello, How can I help you?
            </h2>
            <p className="text-sm text-gray-600">
              Tap the microphone to answer
            </p>
          </div>
        )}
      </div>

      {/* Conversation Messages */}
      <div className="w-full max-w-3xl flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.slice(1).map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm shadow ${
                msg.role === "user"
                  ? "bg-[var(--color-primary)] text-white rounded-br-none"
                  : "bg-[#f1f5f9] text-gray-900 rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
            <span className="text-xs text-gray-500 mt-1">{msg.timestamp}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Mic Button */}
      <div className="mt-6 mb-8">
        <button
          onClick={handleMicClick}
          className={`w-20 h-20 rounded-full shadow-2xl border-4 border-white flex items-center justify-center ${
            listening ? "bg-red-500" : "bg-purple-100"
          }`}
        >
          <FaMicrophone size={28} className="text-[var(--color-primary)]" />
        </button>
      </div>
    </div>
  );
}
