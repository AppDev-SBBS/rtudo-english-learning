"use client";

import React, { useState, useEffect } from "react";
import {
  FaBookOpen,
  FaChalkboardTeacher,
  FaRobot,
} from "react-icons/fa";
import { MdOutlineHeadphones } from "react-icons/md";
import { PiDownloadSimple, PiTargetBold } from "react-icons/pi";
import { LuPencil } from "react-icons/lu";
import { FiTrendingUp } from "react-icons/fi";
import { useAuth } from "@/app/context/AuthContext";
import Navbar from "../components/Navbar";
import Loader from "../components/Loader";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/firebase/firebaseConfig";

export default function SubscriptionPlans() {
  const [loading, setLoading] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userPlan, setUserPlan] = useState(null);
  const [invoices, setInvoices] = useState([]);

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchUserPlans = async () => {
      if (!user?.uid) return;

      const subRef = doc(db, "subscription", user.uid);
      const subSnap = await getDoc(subRef);
      if (subSnap.exists()) {
        const data = subSnap.data();
        setUserPlan(data?.current || null); // Full plan object
        setInvoices(data?.plans || []);
      }
    };
    fetchUserPlans();
  }, [user]);

  const plans = {
    basic: {
      id: "basic",
      name: "Basic",
      price: 99,
      originalPrice: null,
      features: [
        { icon: FaBookOpen, text: "Access to first 5 chapters" },
        { icon: LuPencil, text: "Basic practice exercises" },
        { icon: MdOutlineHeadphones, text: "Standard support" },
        { icon: FiTrendingUp, text: "Progress tracking" },
      ],
      color: "#2c82e6",
      popular: false,
    },
    pro: {
      id: "pro",
      name: "Pro",
      price: 999,
      originalPrice: 4999,
      features: [
        { icon: FaBookOpen, text: "Access to all chapters" },
        { icon: LuPencil, text: "Unlimited practice exercises" },
        { icon: MdOutlineHeadphones, text: "Priority support 24/7" },
        { icon: PiDownloadSimple, text: "Download offline lessons" },
        { icon: FaRobot, text: "AI-powered learning path" },
        { icon: FaChalkboardTeacher, text: "Personal tutor sessions" },
        { icon: PiTargetBold, text: "Custom learning plan" },
      ],
      color: "#814096",
      popular: true,
    },
  };

  const initializeRazorpay = () =>
    new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const createOrder = async (planId) => {
    const response = await fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId,
        amount: plans[planId].price * 100,
        currency: "INR",
      }),
    });
    if (!response.ok) throw new Error("Failed to create order");
    return await response.json();
  };

  const verifyPayment = async (paymentData) => {
    const response = await fetch("/api/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || "Payment verification failed");
    }

    return result;
  };

  const handlePayment = async (planId) => {
    try {
      if (!user?.uid) return alert("User not logged in");
      if (!process.env.RAZORPAY_KEY_ID)
        return alert("Razorpay Key ID not found");

      setLoading(planId);

      const isRazorpayLoaded = await initializeRazorpay();
      if (!isRazorpayLoaded) return alert("Razorpay SDK failed to load");

      const orderData = await createOrder(planId);

      const options = {
        key: process.env.RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Learning Platform",
        description: `${plans[planId].name} Plan Subscription`,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            setIsVerifying(true);
            const verificationResult = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId,
            });

            if (verificationResult.success) {
              const unlockRes = await fetch("/api/unlock-chapters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  planId,
                  amount: plans[planId].price,
                  currency: "INR",
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  userId: user.uid,
                }),
              });

              const unlockResult = await unlockRes.json();
              if (!unlockResult.success) {
                alert(unlockResult.error || "Failed to unlock content.");
                return;
              }

              alert(`✅ ${plans[planId].name} plan activated!`);
              router.refresh();
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (error) {
            console.error("Payment error:", error);
            alert("Payment verification failed.");
          } finally {
            setIsVerifying(false);
          }
        },
        prefill: {
          name: user.displayName || "User",
          email: user.email || "user@example.com",
          contact: "9999999999",
        },
        theme: { color: plans[planId].color },
        modal: {
          ondismiss: () => console.log("Payment modal closed"),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (res) {
        console.error("Payment failed:", res.error);
        alert(`Payment failed: ${res.error.description}`);
      });
      rzp.open();
    } catch (error) {
      console.error(error);
      alert("Payment could not be completed.");
    } finally {
      setLoading(null);
    }
  };

  const PlanCard = ({ plan }) => {
    const isCurrentPlan = userPlan?.plan === plan.id;

    return (
      <div className="rounded-3xl border overflow-hidden mb-6 shadow-sm transition-all hover:shadow-md opacity-100">
        <div
          className="py-8 text-center text-white relative"
          style={{ backgroundColor: plan.color }}
        >
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
            {plan.id === "basic" ? (
              <LuPencil className="text-3xl" />
            ) : (
              <FaRobot className="text-3xl" />
            )}
          </div>
          <h2 className="text-xl font-semibold">{plan.name}</h2>
          {plan.originalPrice && (
            <p className="text-sm line-through">INR {plan.originalPrice}</p>
          )}
          <p className="text-lg font-bold">
            INR {plan.price}{" "}
            <span className="text-base font-medium">/month</span>
          </p>
          {plan.popular && (
            <span className="absolute top-2 right-2 bg-white text-[#814096] text-[10px] px-2 py-[2px] font-bold rounded-full shadow-sm">
              Most Popular
            </span>
          )}
        </div>
        <ul className="text-sm px-6 py-4 space-y-3 font-medium">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2">
              <feature.icon className="text-lg" /> {feature.text}
            </li>
          ))}
        </ul>
        <div className="px-6 pb-6 pt-2">
          <button
            onClick={() => handlePayment(plan.id)}
            disabled={isCurrentPlan || loading === plan.id}
            className="w-full py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ backgroundColor: plan.color, color: "#fff" }}
          >
            {isCurrentPlan
              ? "Current Plan"
              : loading === plan.id
              ? "Processing..."
              : "Select Plan"}
          </button>
        </div>
      </div>
    );
  };

  const InvoiceCard = ({ plan }) => (
    <div className="border rounded-xl p-4 my-4 bg-gray-50 shadow-sm">
      <h3 className="text-lg font-bold text-[var(--color-primary)] mb-2">
        📄 Invoice
      </h3>
      <p>
        <strong>Plan:</strong> {plan.plan.toUpperCase()}
      </p>
      <p>
        <strong>Amount:</strong> ₹{plan.amount}
      </p>
      <p>
        <strong>Start Date:</strong>{" "}
        {new Date(plan.startDate.seconds * 1000).toLocaleDateString()}
      </p>
      <p>
        <strong>End Date:</strong>{" "}
        {new Date(plan.endDate.seconds * 1000).toLocaleDateString()}
      </p>
      <p>
        <strong>Status:</strong> {plan.status}
      </p>
      <p>
        <strong>Order ID:</strong> {plan.razorpay_order_id}
      </p>
    </div>
  );

  return (
    <div className="relative min-h-screen pb-24">
      {isVerifying && <Loader />}
      <div className="fixed top-0 left-0 w-full z-10 shadow-sm border-b bg-white">
        <div className="px-4 py-4 max-w-xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-1 text-[var(--color-primary)]">
            Choose Your Plan
          </h1>
          <p className="text-sm text-gray-600">
            Select the perfect plan for your learning journey
          </p>
        </div>
      </div>

      <div className="pt-[120px] px-4 max-w-xl mx-auto">
        {!userPlan && (
          <>
            <PlanCard plan={plans.basic} />
            <PlanCard plan={plans.pro} />
          </>
        )}

        {userPlan?.plan === "basic" && (
          <>
            <InvoiceCard plan={userPlan} />
            <PlanCard plan={plans.pro} />
          </>
        )}

        {userPlan?.plan === "pro" && (
          <>
            <InvoiceCard plan={userPlan} />
            <PlanCard plan={plans.basic} />
          </>
        )}
      </div>

      <Navbar />
    </div>
  );
}
