"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Volume2, ChevronRight, RotateCcw, CheckCircle2, AlertCircle, Zap } from "lucide-react"

interface FlashcardProps {
  word: {
    id: string;
    text: string;
    ipa: string;
    vietnamese: string;
    definition: string;
    example: string;
    context_sentence: string;
    audio: string;
    part_of_speech: string;
  };
  onReview: (quality: 0 | 1 | 2) => void;
}

export default function Flashcard({ word, onReview }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const playAudio = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!word.audio) return
    const audio = new Audio(word.audio)
    audio.play()
  }

  const renderContext = (sentence: string, targetWord: string) => {
    if (!sentence) return null
    const parts = sentence.split(new RegExp(`(${targetWord})`, 'gi'))
    return (
      <p className="text-2xl leading-relaxed text-slate-700 dark:text-slate-300 font-bold font-sans px-6">
        {parts.map((part, i) => 
          part.toLowerCase() === targetWord.toLowerCase() ? (
            <span key={i} className="px-3 py-1 mx-1 bg-primary/10 text-primary rounded-xl border-b-4 border-primary font-black uppercase italic-extra translate-y-[-2px] inline-block">
              {isFlipped ? part : "____"}
            </span>
          ) : part
        )}
      </p>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto perspective-1000 h-[550px] font-sans">
      <motion.div
        className="relative w-full h-full text-center transition-all duration-700 preserve-3d cursor-pointer"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front Face */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden bg-white dark:bg-slate-900 rounded-[4rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl p-16 flex flex-col items-center justify-center gap-12"
        >
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center">
            <Zap className="w-10 h-10 fill-current" />
          </div>
          <div className="space-y-8 w-full text-center">
            {word.context_sentence ? (
              renderContext(word.context_sentence, word.text)
            ) : (
              <h2 className="text-7xl font-black text-primary font-display uppercase italic-extra tracking-tighter leading-none">{word.text}</h2>
            )}
            <div className="flex flex-col items-center gap-2">
              <p className="text-slate-300 dark:text-slate-600 text-xs font-black uppercase tracking-[0.3em] font-display italic">Nhấn để xem đáp án</p>
              <div className="h-1.5 w-12 bg-slate-100 dark:bg-slate-800 rounded-full" />
            </div>
          </div>
        </div>

        {/* Back Face */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden bg-white dark:bg-slate-900 rounded-[4rem] border-4 border-primary/20 dark:border-primary/10 shadow-2xl p-16 flex flex-col items-center justify-between rotate-y-180"
        >
          <div className="w-full flex justify-between items-start">
            <span className="px-5 py-2 bg-primary/10 text-primary text-[11px] font-black rounded-2xl uppercase tracking-widest border border-primary/20 italic">
              {word.part_of_speech || "Word"}
            </span>
            <button 
              onClick={playAudio}
              className="w-16 h-16 bg-primary text-white rounded-[2rem] flex items-center justify-center hover:scale-110 shadow-[0_6px_0_0_rgba(0,0,0,0.1)] active:translate-y-1 active:shadow-none transition-all"
            >
              <Volume2 className="w-8 h-8" />
            </button>
          </div>

          <div className="text-center space-y-6">
            <h2 className="text-6xl font-black text-primary font-display uppercase italic-extra tracking-tighter leading-none">{word.text}</h2>
            <div className="inline-block px-6 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-full font-mono text-xl text-slate-500 tracking-widest border-2 border-slate-100 dark:border-slate-800">
              {word.ipa}
            </div>
            <div className="pt-8 space-y-4">
              <p className="text-4xl font-black text-slate-800 dark:text-white leading-tight">{word.vietnamese}</p>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed font-bold italic text-sm">{word.definition}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 w-full pt-10 border-t-2 border-slate-50 dark:border-slate-800">
            <button 
              onClick={(e) => { e.stopPropagation(); onReview(0); }}
              className="flex flex-col items-center gap-3 p-4 rounded-[2rem] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 transition-all group active:translate-y-1"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <RotateCcw className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Lại (1d)</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onReview(1); }}
              className="flex flex-col items-center gap-3 p-4 rounded-[2rem] hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-500 transition-all group active:translate-y-1"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertCircle className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Khó</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onReview(2); }}
              className="flex flex-col items-center gap-3 p-4 rounded-[2rem] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-500 transition-all group active:translate-y-1"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Dễ</span>
            </button>
          </div>
        </div>
      </motion.div>

      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .italic-extra {
          font-style: italic;
          font-weight: 1000;
        }
      `}</style>
    </div>
  )
}
