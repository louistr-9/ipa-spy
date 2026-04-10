"use client"

import { motion } from "framer-motion"
import { Flame } from "lucide-react"

interface StreakFlameProps {
  streak: number;
}

export default function StreakFlame({ streak }: StreakFlameProps) {
  if (streak === 0) return null;

  // Cấp độ lửa (DuoCards x Gamification)
  const getFlameLevel = (s: number) => {
    if (s <= 3) return { color: "text-orange-400", scale: 1, blur: "blur-none", label: "Ember" };
    if (s <= 7) return { color: "text-orange-500", scale: 1.2, blur: "blur-[1px]", label: "Spark" };
    if (s <= 14) return { color: "text-orange-600", scale: 1.4, blur: "blur-[2px]", label: "Blaze" };
    if (s <= 30) return { color: "text-red-500", scale: 1.6, blur: "blur-[4px]", label: "Inferno" };
    return { color: "text-indigo-500", scale: 1.8, blur: "blur-[8px]", label: "Supernova" };
  };

  const level = getFlameLevel(streak);

  return (
    <div className="relative group cursor-pointer active:scale-95 transition-transform">
      <motion.div
        animate={{
          scale: [level.scale, level.scale * 1.05, level.scale],
          rotate: [0, -2, 2, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`relative z-10 ${level.color}`}
      >
        <Flame className="w-6 h-6 fill-current drop-shadow-lg" />
      </motion.div>
      
      {/* Glow Effect */}
      <div 
        className={`absolute inset-0 ${level.color} opacity-20 ${level.blur} rounded-full -z-10`}
      />

      {/* Duo-style Tooltip */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-4 py-2 bg-slate-900 text-white text-[10px] font-black rounded-2xl opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 whitespace-nowrap z-50 pointer-events-none shadow-2xl border-2 border-slate-800">
        <span className="text-primary-light">{streak} NGÀY STREAK</span>
        <div className="text-[8px] opacity-60 mt-0.5">{level.label.toUpperCase()} MODE</div>
      </div>
    </div>
  );
}
