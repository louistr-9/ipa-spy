"use client"

import { useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase"
import { 
  TrendingUp, Calendar, AlertCircle, 
  BarChart, PieChart, Info, ChevronLeft, 
  ChevronRight, Trophy, BookOpen, GraduationCap
} from "lucide-react"
import StreakFlame from "./StreakFlame"

interface AnalyticsProps {
  words: any[];
  streak: number;
  sysLang?: "EN" | "VI";
}

export default function Analytics({ words, streak, sysLang = "VI" }: AnalyticsProps) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewDate, setViewDate] = useState(new Date())
  const supabase = createClient()

  const t = {
    VI: {
      achievements: "Thành tựu của bạn",
      streak: "Chuỗi ngày",
      level: "Cấp độ",
      total: "Tổng số từ",
      learning: "Đang học",
      mastered: "Đã thuộc",
      activity: "Hoạt động học tập",
      lessons: "bài học",
      rest: "Nghỉ ngơi",
      warmup: "Khởi động",
      hardworking: "Cực chăm",
      sage: "Nhà Thông Thái",
      mon_long: "vi-VN"
    },
    EN: {
      achievements: "Your Achievements",
      streak: "Daily Streak",
      level: "Level",
      total: "Total Words",
      learning: "Learning",
      mastered: "Mastered",
      activity: "Study Activity",
      lessons: "lessons",
      rest: "Rest",
      warmup: "Warm-up",
      hardworking: "Focus",
      sage: "The Wise One",
      mon_long: "en-US"
    }
  }[sysLang]

  useEffect(() => {
    const fetchLogs = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("study_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })

      if (!error && data) {
        setLogs(data)
      }
      setLoading(false)
    }

    fetchLogs()
  }, [])

  // Month-by-month Heatmap Logic
  const heatmapData = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    
    // Get first and last day of current view month
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const data: { date: Date, count: number }[] = []
    
    // Fill the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d)
      const count = logs.filter(log => {
        const logDate = new Date(log.created_at)
        return logDate.toDateString() === date.toDateString()
      }).length
      
      data.push({ date, count })
    }

    return data
  }, [logs, viewDate])

  const stats = useMemo(() => {
    const total = words.length
    const learning = words.filter(w => (w.interval || 0) > 0 && (w.interval || 0) <= 14).length
    const mastered = words.filter(w => (w.interval || 0) > 14).length
    return { total, learning, mastered }
  }, [words])

  const nextMonth = () => {
    const next = new Date(viewDate)
    next.setMonth(next.getMonth() + 1)
    if (next <= new Date()) setViewDate(next)
  }

  const prevMonth = () => {
    const prev = new Date(viewDate)
    prev.setMonth(prev.getMonth() - 1)
    setViewDate(prev)
  }

  const getHeatmapColor = (count: number) => {
    if (count === 0) return "bg-slate-100 dark:bg-slate-800"
    if (count < 3) return "bg-primary/30"
    if (count < 6) return "bg-primary/60"
    return "bg-primary"
  }

  return (
    <div className="space-y-12 pb-20 font-sans">
      {/* Header with Streak */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white dark:bg-slate-900 p-10 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl shadow-black/5">
        <div className="flex items-center gap-8">
          <div className="relative">
             <StreakFlame streak={streak} />
          </div>
          <div>
            <h2 className="text-5xl font-black tracking-tighter font-display uppercase italic-extra leading-none mb-2">{t.achievements}</h2>
            <div className="flex items-center gap-4 text-slate-400 font-bold">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>{t.level} {Math.floor(words.length / 10) + 1} - {t.sage}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="px-8 py-4 bg-primary/5 rounded-3xl border-2 border-primary/10 text-center min-w-[120px]">
            <p className="text-[10px] font-black uppercase text-primary/60 tracking-widest mb-1">{t.streak}</p>
            <p className="text-3xl font-black text-primary font-display">{streak}</p>
          </div>
        </div>
      </div>

      {/* Core Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: <BookOpen className="w-6 h-6" />, label: t.total, value: stats.total, color: "text-indigo-500", bg: "bg-indigo-50/50 dark:bg-indigo-900/10", border: "border-indigo-100 dark:border-indigo-900/30" },
          { icon: <TrendingUp className="w-6 h-6" />, label: t.learning, value: stats.learning, color: "text-amber-500", bg: "bg-amber-50/50 dark:bg-amber-900/10", border: "border-amber-100 dark:border-amber-900/30" },
          { icon: <GraduationCap className="w-6 h-6" />, label: t.mastered, value: stats.mastered, color: "text-emerald-500", bg: "bg-emerald-50/50 dark:bg-emerald-900/10", border: "border-emerald-100 dark:border-emerald-900/30" }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`${stat.bg} ${stat.border} p-10 rounded-[3rem] border-2 shadow-sm group hover:scale-[1.02] transition-all`}
          >
            <div className={`w-12 h-12 ${stat.color} mb-6 flex items-center justify-center`}>
              {stat.icon}
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[11px] mb-2">{stat.label}</p>
            <p className={`text-5xl font-black ${stat.color} font-display italic-extra`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Heatmap with Month Navigation */}
      <div className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl shadow-black/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <h3 className="text-2xl font-black font-display uppercase italic-extra flex items-center gap-4">
            <Calendar className="text-primary w-8 h-8" /> {t.activity}
          </h3>
          
          <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
            <button 
              onClick={prevMonth}
              className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all text-slate-400 hover:text-primary"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-sm font-black uppercase tracking-widest min-w-[150px] text-center font-display">
              {viewDate.toLocaleDateString(t.mon_long, { month: 'long', year: 'numeric' })}
            </span>
            <button 
              onClick={nextMonth}
              className={`p-2 rounded-xl transition-all ${viewDate.getMonth() === new Date().getMonth() && viewDate.getFullYear() === new Date().getFullYear() ? "opacity-20 cursor-not-allowed" : "hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-primary"}`}
              disabled={viewDate.getMonth() === new Date().getMonth() && viewDate.getFullYear() === new Date().getFullYear()}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-3 max-w-2xl mx-auto">
          {(sysLang === "VI" ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] : ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']).map(d => (
            <div key={d} className="text-[10px] font-black text-slate-300 text-center uppercase mb-2">{d}</div>
          ))}
          
          {Array.from({ length: new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="w-full aspect-square opacity-0" />
          ))}
          
          {heatmapData.map((day, i) => (
            <motion.div 
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.01 }}
              className={`w-full aspect-square rounded-xl cursor-help transition-all hover:scale-125 active:scale-90 relative group ${getHeatmapColor(day.count)}`}
            >
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black opacity-0 group-hover:opacity-40 pointer-events-none">
                {day.date.getDate()}
              </div>
              
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-2 bg-slate-900 text-white text-[10px] font-black rounded-2xl opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none shadow-xl border-2 border-slate-800 transition-all scale-90 group-hover:scale-100">
                {day.date.toLocaleDateString(t.mon_long)}: {day.count} {t.lessons}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 pt-10 border-t-2 border-slate-50 dark:border-slate-800">
          <div className="flex items-center gap-3">
             <div className="w-4 h-4 bg-slate-100 dark:bg-slate-800 rounded-md" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.rest}</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-4 h-4 bg-primary/30 rounded-md" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.warmup}</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-4 h-4 bg-primary rounded-md" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.hardworking}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
