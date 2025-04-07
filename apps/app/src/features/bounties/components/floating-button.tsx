"use client";

import { Plus } from "lucide-react";

export default function FloatingButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <button
      {...props}
      className="group fixed bottom-20 right-10 flex cursor-pointer items-end justify-end p-2"
      type="button"
    >
      {/* main */}
      <span className="absolute z-50 flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 p-3 text-white shadow-xl">
        <Plus className="duration-[0.6s] h-6 w-6 transition-all group-hover:rotate-90" />
      </span>

      {/* sub middle */}
      <span className="duration-[0.2s] absolute flex w-40 scale-x-0 justify-center rounded-xl bg-zinc-200 py-2 transition-all ease-out group-hover:-translate-x-8 group-hover:-translate-y-12 group-hover:scale-x-100">
        Post New Bounty
      </span>
    </button>
  );
}
