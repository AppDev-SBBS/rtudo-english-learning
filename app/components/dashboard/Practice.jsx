"use client";

import { useRouter } from "next/navigation";
import { FaMicrophone, FaHeadphones, FaPen, FaBookOpen } from "react-icons/fa";

export default function PracticeSkillsCard() {
  const router = useRouter();

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Practice Skills</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SkillCard
          icon={<FaMicrophone size={20} />}
          bgColor="bg-red-100"
          iconColor="text-red-500"
          title="Speaking"
          subtitle="Practice pronunciation"
          onClick={() => router.push("/practice/exam/speaking")}
        />
        <SkillCard
          icon={<FaHeadphones size={20} />}
          bgColor="bg-green-100"
          iconColor="text-green-500"
          title="Listening"
          subtitle="Improve comprehension"
          onClick={() => router.push("/practice/exam/listening")}
        />
        <SkillCard
          icon={<FaPen size={20} />}
          bgColor="bg-blue-100"
          iconColor="text-blue-500"
          title="Writing"
          subtitle="Practice your writing skills"
          onClick={() => router.push("/practice/exam/writing")}
        />
        <SkillCard
          icon={<FaBookOpen size={20} />}
          bgColor="bg-emerald-100"
          iconColor="text-emerald-500"
          title="Reading"
          subtitle="Enhance reading skills"
          onClick={() => router.push("/practice/exam/reading")}
        />
      </div>
    </div>
  );
}

function SkillCard({ icon, bgColor, iconColor, title, subtitle, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-purple-50 rounded-lg flex flex-col items-center justify-center p-4 text-center hover:shadow-md transition-shadow"
    >
      <div className={`${bgColor} ${iconColor} p-3 rounded-full mb-2`}>
        {icon}
      </div>
      <h4 className="font-semibold text-gray-900">{title}</h4>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}
