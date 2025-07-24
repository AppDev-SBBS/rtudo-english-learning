"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaMicrophone } from "react-icons/fa";
import { MdArrowBack, MdAccessTime, MdSend } from "react-icons/md";
import { FaStar } from "react-icons/fa6";
import { BiUserVoice } from "react-icons/bi";
import { BsRobot } from "react-icons/bs";

export default function ChatPage() {
  const router = useRouter();
  const bottomRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  const SpeechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (recognition) {
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setListening(false);
        sendMessage(transcript); // auto-send after recording
      };

      recognition.onerror = () => {
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };
    }
  }, [recognition]);

  const handleMicClick = () => {
    if (!recognition) return alert("Speech recognition not supported in this browser.");
    if (listening) {
      recognition.stop();
    } else {
      recognition.start();
      setListening(true);
    }
  };

  const sendMessage = async (customInput) => {
    const finalInput = customInput || input.trim();
    if (!finalInput) return;

    const userMessage = {
      role: "user",
      text: finalInput,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
      const data = await res.json();

      const botMessage = {
        role: "assistant",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      // Speak AI response
      const utterance = new SpeechSynthesisUtterance(botMessage.text);
      utterance.lang = "en-US";
      speechSynthesis.speak(utterance);

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const failMessage = {
        role: "assistant",
        text: "Sorry, I couldn't respond. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, failMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans relative">
      {/* Header */}
      <div className="fixed top-0 left-0 w-full bg-white z-10 border-b border-gray-100 shadow-sm">
        <div className="px-4 py-4 max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => router.back()}>
            <MdArrowBack size={24} />
          </button>
          <h1 className="font-semibold text-lg">Ask AI</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
              <FaStar className="mr-1" /> 1740 XP
            </div>
            <MdAccessTime size={22} />
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="pt-[100px] pb-28 px-4 max-w-3xl mx-auto space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-end ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="mr-2 bg-[var(--color-primary)] text-white p-2 rounded-full">
                <BsRobot size={18} />
              </div>
            )}
            <div className="max-w-[75%] flex flex-col space-y-1">
              <div
                className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap shadow-sm ${
                  msg.role === "user"
                    ? "bg-[var(--color-primary)] text-white rounded-br-none"
                    : "bg-[#f1f5f9] text-gray-900 rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
              <span
                className={`text-[10px] ${
                  msg.role === "user" ? "text-right text-white pr-1" : "text-left text-gray-500"
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start">
            <div className="bg-[#f1f5f9] text-gray-400 px-4 py-3 rounded-2xl text-sm shadow">
              Typing...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Floating Interview Button */}
      <div className="max-w-3xl mx-auto px-4">
        <button
  onClick={() => router.push("/ai/interview")}
  className="fixed bottom-24 right-6 bg-[var(--color-primary)] text-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-sm font-medium"
>
  <BiUserVoice size={18} />
  Interview
</button>

      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
          <div className="flex-1 bg-gray-100 px-4 py-2 rounded-full flex items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full bg-transparent outline-none text-sm"
            />
          </div>
          <button
            onClick={handleMicClick}
            className={`p-3 rounded-full ${
              listening ? "bg-red-500" : "bg-[var(--color-primary)]"
            } text-white`}
          >
            <FaMicrophone size={18} />
          </button>
          <button
            disabled={loading}
            onClick={() => sendMessage()}
            className="bg-[var(--color-primary)] text-white p-3 rounded-full"
          >
            <MdSend size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
