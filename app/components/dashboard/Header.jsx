"use client";

import Image from "next/image";
import { MdOutlineWbSunny } from "react-icons/md";

export default function Header() {
  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-purple-100 rounded-xl shadow-sm">
      <Image
        src="/assets/logo.png"
        alt="R-Tudo Logo"
        width={120}
        height={120}
      />
      <MdOutlineWbSunny className="text-[var(--color-primary)] text-2xl" />
    </div>
  );
}
