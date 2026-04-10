"use client"

import { useState, useEffect } from "react"
import { Search, BookMarked, Zap, Globe, Code, Monitor, ArrowRight, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { createClient } from "@/lib/supabase"

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] text-slate-900 dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-900/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Zap className="text-white w-6 h-6 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-400">
              IPA SPY
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Tính năng</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Hướng dẫn</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Cộng đồng</a>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2"
              >
                Vào Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                onClick={handleLogin}
                className="px-6 py-2.5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-full text-sm font-semibold hover:opacity-90 transition-all"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold mb-6 tracking-wider uppercase border border-indigo-100 dark:border-indigo-800">
              <Monitor className="w-3.5 h-3.5" /> Chrome Extension chính thức
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-8">
              Bậc thầy phát âm với <br />
              <span className="text-indigo-600">IPA Spy</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-xl">
              Công cụ tra cứu IPA và nghĩa từ vựng ngay tức thì trên trình duyệt. 
              Tự động đồng bộ hóa lên đám mây và luyện tập hiệu quả với hệ thống Flashcard thông minh.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-3 group">
                Thêm vào Chrome <Monitor className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
              <button className="h-14 px-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl font-bold transition-all flex items-center justify-center gap-3">
                Xem Demo <Zap className="w-5 h-5 text-amber-500" />
              </button>
            </div>
            
            <div className="mt-12 flex items-center gap-8">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-950 bg-slate-200" />
                ))}
              </div>
              <p className="text-sm font-medium text-slate-500">
                Được tin dùng bởi <span className="text-slate-900 dark:text-slate-100">1,000+</span> người học tiếng Anh
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="glass-card rounded-[2rem] overflow-hidden aspect-[4/3] relative z-10 p-4">
              <div className="bg-slate-50 dark:bg-slate-950 w-full h-full rounded-[1.5rem] border border-slate-200 dark:border-slate-800 p-8">
                {/* Mockup UI Content */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="space-y-6">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-full w-2/3" />
                  <div className="h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 relative overflow-hidden">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-600 rounded-lg" />
                      <div className="space-y-2">
                        <div className="h-3 bg-indigo-200 dark:bg-indigo-700 rounded-full w-24" />
                        <div className="h-2 bg-indigo-100 dark:bg-indigo-800 rounded-full w-32" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800" />
                    <div className="h-32 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20" />
                  </div>
                </div>
              </div>
            </div>
            {/* Absolute Decor Elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-600/20 rounded-full blur-[40px] z-0" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-600/20 rounded-full blur-[60px] z-0" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">Trải nghiệm học tập tối giản</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
              Mọi tính năng quan trọng đều được chúng tôi thiết kế lại để tập trung vào mục tiêu duy nhất: Giúp bạn ghi nhớ từ vựng lâu hơn.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: <Search className="w-8 h-8 text-indigo-600" />, 
                title: "Tra cứu tức thì", 
                desc: "Chỉ cần bôi đen từ trên bất kỳ trang web nào, IPA Spy sẽ hiện ngay phiên âm và nghĩa tiếng Việt." 
              },
              { 
                icon: <CloudSync className="w-8 h-8 text-purple-600" />, 
                title: "Đồng bộ đa thiết bị", 
                desc: "Tự động lưu từ vựng vào tài khoản. Xem lại chúng trên Web hay Extension bất cứ lúc nào." 
              },
              { 
                icon: <Zap className="w-8 h-8 text-amber-500" />, 
                title: "Flashcard thông minh", 
                desc: "Áp dụng phương pháp Spaced Repetition (Lặp lại ngắt quãng) để từ vựng ghim sâu vào trí nhớ." 
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -10 }}
                className="p-10 bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-8">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <Zap className="text-indigo-600 w-5 h-5 fill-current" />
            <span className="font-bold text-lg">IPA SPY</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 IPA Spy. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <Code className="w-6 h-6" />
            </a>
            <a href="#" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <Globe className="w-6 h-6" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function CloudSync({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 2v8"/><path d="m16 6-4-4-4 4"/><path d="M12 22v-8"/><path d="m8 18 4 4 4-4"/><path d="M4.5 10.04A6 6 0 0 1 12 4a6 6 0 0 1 7.5 6.04"/><path d="M19.5 13.96A6 6 0 0 1 12 20a6 6 0 0 1-7.5-6.04"/>
    </svg>
  )
}
