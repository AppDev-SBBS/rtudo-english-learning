// /app/api/unlock-chapters/route.js

import { db } from "@/app/firebase/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      userId,
      planId,
      amount,
      currency,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    const subscriptionRef = doc(db, "subscriptions", userId);
    const snap = await getDoc(subscriptionRef);

    const now = new Date();
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30); // 30 days validity

    const currentPlan = snap.exists() ? snap.data() : null;

    // 🚫 Prevent override if active subscription still valid
    if (
  currentPlan &&
  currentPlan.status === "active" &&
  currentPlan.expiresAt.toDate() > now &&
  currentPlan.plan === planId // 🚫 Only block if same plan is already active
) {
  return new Response(
    JSON.stringify({ success: false, error: "Plan already active" }),
    { status: 409 }
  );
}


    // ✅ Define plan-specific features
    const features =
      planId === "pro"
        ? {
            maxChapters: Infinity,
            unlimitedPractice: true,
            offlineAccess: true,
            prioritySupport: true,
            aiTutor: true,
          }
        : {
            maxChapters: 5,
            unlimitedPractice: false,
            offlineAccess: false,
            prioritySupport: false,
            aiTutor: false,
          };

    // ✅ Store subscription in /subscriptions/{uid}
    const subscriptionData = {
      plan: planId,
      planType: planId,
      amount,
      currency,
      startDate,
      endDate,
      isActive: true,
      status: "active",
      features,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      createdAt: startDate,
      expiresAt: endDate,
    };

    await setDoc(subscriptionRef, subscriptionData, { merge: true });

    // ✅ Also update plan in users collection
    const userProfileRef = doc(db, "users", userId);
    await setDoc(
      userProfileRef,
      {
        plan: planId,
        planExpiresAt: endDate,
        subscriptionStatus: "active",
      },
      { merge: true }
    );

    return new Response(
      JSON.stringify({ success: true, message: "Subscription activated" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error unlocking chapters:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
