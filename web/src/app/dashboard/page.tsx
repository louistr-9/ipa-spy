"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase"
import { 
  Plus, Search, Filter, LogOut, Book, 
  Play, Volume2, Trash2, LayoutGrid, 
  List, GraduationCap, ChevronLeft, ChevronRight,
  Brain, BarChart3, Clock, Sparkles, ArrowRight,
  Palette, Globe, Star, Users, Flame,
  Library, BookOpen, Smartphone, User, X, ChevronDown
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Flashcard from "@/components/Flashcard"
import Analytics from "@/components/Analytics"
import { calculateSRS, ReviewQuality } from "@/lib/srs"
import { useTheme, ThemeType } from "@/context/ThemeContext"
import StreakFlame from "@/components/StreakFlame"

type MainTab = "study" | "library" | "analytics" | "account";
type StudySubTab = "practice" | "words";
type SysLang = "EN" | "VI";

const UI_STRINGS: Record<SysLang, any> = {
  "VI": {
    study: "Phòng học",
    library: "Thư viện",
    analytics: "Thành tựu",
    account: "Tài khoản",
    practice: "LUYỆN TẬP",
    words: "TỦ TỪ VỰNG",
    ready_to_study: "Giờ học đã điểm!",
    start_now: "BẮT ĐẦU NGAY",
    cards_due: "Số thẻ đến hạn",
    all_conquered: "Tất cả mục tiêu đã chinh phục! 🎉",
    explore_languages: "Khám phá ngôn ngữ",
    my_languages: "Ngôn ngữ của bạn",
    learn_new: "Học ngôn ngữ mới",
    system_language: "Ngôn ngữ hệ thống",
    logout: "Đăng xuất",
    recent: "Mới mở gần đây",
    courses: "Khóa học chuyên sâu",
    sets: "Bộ sưu tập thẻ",
    videos: "Học qua Video",
    add: "Thêm",
    create_deck: "Tạo bộ thẻ mới",
    deck_title: "Tên bộ thẻ",
    deck_desc: "Mô tả ngắn",
    select_thumb: "Chọn ảnh bìa",
    save: "Lưu",
    cancel: "Hủy"
  },
  "EN": {
    study: "Study Hall",
    library: "Library",
    analytics: "Achievements",
    account: "Account",
    practice: "PRACTICE",
    words: "VOCABULARY",
    ready_to_study: "Ready to Study!",
    start_now: "START NOW",
    cards_due: "Cards Due",
    all_conquered: "All goals conquered! 🎉",
    explore_languages: "Explore Languages",
    my_languages: "Your Languages",
    learn_new: "Learn New Language",
    system_language: "System Language",
    logout: "Logout",
    recent: "Last Opened",
    courses: "Intensive Courses",
    sets: "Card Collections",
    videos: "Learn via Video",
    add: "Add",
    create_deck: "Create New Deck",
    deck_title: "Deck Title",
    deck_desc: "Short Description",
    select_thumb: "Select Thumbnail",
    save: "Save",
    cancel: "Cancel"
  }
};

const SAMPLE_THUMBS = [
  "https://images.unsplash.com/photo-1544648151-51535491745a?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1497633272928-505889230567?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1510357173974-bc0ca2525384?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=300&q=80"
];

interface Language {
  code: string;
  name: string;
  flag: string;
}

const ALL_LANGUAGES: Language[] = [
  { code: "EN", name: "ENGLISH", flag: "🇺🇸" },
  { code: "VI", name: "VIETNAMESE", flag: "🇻🇳" },
  { code: "JA", name: "JAPANESE", flag: "🇯🇵" },
  { code: "KO", name: "KOREAN", flag: "🇰🇷" },
  { code: "ZH", name: "CHINESE", flag: "🇨🇳" },
  { code: "FR", name: "FRENCH", flag: "🇫🇷" },
  { code: "DE", name: "GERMAN", flag: "🇩🇪" },
  { code: "ES", name: "SPANISH", flag: "🇪🇸" },
  { code: "IT", name: "ITALIAN", flag: "🇮🇹" },
  { code: "PT", name: "PORTUGUESE", flag: "🇵🇹" },
  { code: "RU", name: "RUSSIAN", flag: "🇷🇺" },
  { code: "TH", name: "THAI", flag: "🇹🇭" },
  { code: "HI", name: "HINDI", flag: "🇮🇳" },
  { code: "AR", name: "ARABIC", flag: "🇸🇦" },
  { code: "TR", name: "TURKISH", flag: "🇹🇷" },
  { code: "NL", name: "DUTCH", flag: "🇳🇱" },
  { code: "PL", name: "POLISH", flag: "🇵🇱" },
  { code: "ID", name: "INDONESIAN", flag: "🇮🇩" },
  { code: "MS", name: "MALAY", flag: "🇲🇾" },
];

const LIBRARY_DATA: Record<string, {
  last_opened: any[],
  courses: any[],
  sets: any[],
  videos: any[]
}> = {
  "EN": {
    "last_opened": [
      { id: "en-1", title: "Thuật ngữ máy tính", words: 70, rating: 4.8, level: "moderate", image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=300&q=80", completed: true },
      { id: "en-2", title: "1000 từ vựng toeic thông dụng", words: 220, rating: 5.0, level: "moderate", image: "https://images.unsplash.com/photo-1434031211128-095490e7e7bb?auto=format&fit=crop&w=300&q=80", completed: true },
    ],
    "courses": [
      { id: "c-1", title: "Khóa học dành cho người mới bắt đầu", words: 309, students: 27, rating: 5, level: "beginner", image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=300&q=80" },
      { id: "c-2", title: "Khóa học tiếng Anh cơ bản", words: 176, students: 15, rating: 4.9, level: "easy", image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=300&q=80" },
      { id: "c-3", title: "Nói chuyện về quá khứ", words: 131, students: 12, rating: 4.5, level: "easy", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=300&q=80" },
    ],
    "sets": [
      { id: "s-1", title: "Đi du lịch", words: 62, rating: 4.9, level: "moderate", image: "https://images.unsplash.com/photo-1436491865332-7a61a109c055?auto=format&fit=crop&w=300&q=80" },
      { id: "s-2", title: "Thể thao và trò chơi", words: 42, rating: 4.9, level: "moderate", image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=300&q=80" },
      { id: "s-3", title: "3000 common words", words: 222, rating: 5, level: "easy", image: "https://images.unsplash.com/photo-1454165833767-027ff33027b4?auto=format&fit=crop&w=300&q=80" },
    ],
    "videos": [
      { id: "v-1", title: "Harry Potter Book 1", duration: "371:12", rating: 4.9, level: "moderate", image: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=300&q=80" },
      { id: "v-2", title: "Mr. Krabs Being The WORST", duration: "48:44", rating: 4.8, level: "easy", image: "https://images.unsplash.com/photo-1472457897821-70d3819a0e24?auto=format&fit=crop&w=300&q=80" },
    ]
  }
};

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [words, setWords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [layout, setLayout] = useState<"grid" | "list">("grid")
  
  const [activeTab, setActiveTab] = useState<MainTab>("study")
  const [studySubTab, setStudySubTab] = useState<StudySubTab>("practice")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDeckData, setNewDeckData] = useState({ title: "", description: "", thumbnail_url: "" });

  const DECK_PRESETS = [
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=600&auto=format&fit=crop"
  ];
  
  const [selectedLang, setSelectedLang] = useState<Language>(ALL_LANGUAGES[0])
  const [unlockedLanguageCodes, setUnlockedLanguageCodes] = useState<string[]>(["EN"])
  const [studying, setStudying] = useState<any[] | null>(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false)
  
  const [sysLang, setSysLang] = useState<SysLang>("VI")
  const [userDecks, setUserDecks] = useState<any[]>([])

  const t = UI_STRINGS[sysLang]
  
  const { theme, setTheme } = useTheme()
  const supabase = createClient()
  const router = useRouter()
  const themePickerRef = useRef<HTMLDivElement>(null)
  const languageDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/")
        return
      }
      setUser(user)
      
      const savedLangCode = localStorage.getItem("selectedLanguage") || "EN"
      const lang = ALL_LANGUAGES.find(l => l.code === savedLangCode) || ALL_LANGUAGES[0]
      setSelectedLang(lang)
      
      const savedSysLang = localStorage.getItem("systemLanguage") as SysLang
      if (savedSysLang) setSysLang(savedSysLang)

      fetchWords(user.id, lang.code)
      fetchProfile(user.id)
      fetchUserDecks(user.id, lang.code)
    }

    checkUser()

    const handleClickOutside = (event: MouseEvent) => {
      if (themePickerRef.current && !themePickerRef.current.contains(event.target as Node)) {
        setShowThemePicker(false)
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()
    
    if (!error && data) {
      setProfile(data)
      if (data.active_languages) {
        setUnlockedLanguageCodes(data.active_languages)
      }
    }
  }

  const fetchWords = async (userId: string, langCode: string) => {
    setLoading(true)
    const { data, error } = await supabase
      .from("words")
      .select("*")
      .eq("user_id", userId)
      .eq("language", langCode)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setWords(data)
    } else if (error) {
       // Graceful fallback if language column doesn't exist yet
       console.log("Language filtering failed, fetching all words:", error.message);
       const { data: allData } = await supabase
         .from("words")
         .select("*")
         .eq("user_id", userId)
       if (allData) setWords(allData);
    }
    setLoading(false)
  }

  const fetchUserDecks = async (userId: string, langCode: string) => {
    const { data, error } = await supabase
      .from("decks")
      .select("*")
      .eq("creator_id", userId)
      .eq("language", langCode)
    
    if (!error && data) {
      setUserDecks(data)
    }
  }

  const handleLanguageChange = (lang: Language) => {
    setSelectedLang(lang)
    localStorage.setItem("selectedLanguage", lang.code)
    setShowLanguageDropdown(false)
    if (user) {
      fetchWords(user.id, lang.code)
      fetchUserDecks(user.id, lang.code)
    }
  }

  const handleCreateDeck = async () => {
    if (!user || !newDeckData.title) return

    const { data, error } = await supabase
      .from("decks")
      .insert({
        creator_id: user.id,
        title: newDeckData.title,
        description: newDeckData.description,
        language: selectedLang.code,
        thumbnail_url: newDeckData.thumbnail_url || DECK_PRESETS[0],
        is_public: true,
        category: "User Created",
        level: "moderate",
        rating: 5.0
      })
      .select()
      .single()

    if (!error && data) {
      setUserDecks([data, ...userDecks])
      setIsCreateModalOpen(false)
      setNewDeckData({ title: "", description: "", thumbnail_url: "" })
    } else {
      console.error("Error creating deck:", error)
    }
  }

  const unlockLanguage = async (lang: Language) => {
    if (!user) return
    
    const newCodes = Array.from(new Set([...unlockedLanguageCodes, lang.code]))
    setUnlockedLanguageCodes(newCodes)
    
    // Persist to Supabase
    await supabase
      .from("profiles")
      .update({ active_languages: newCodes })
      .eq("id", user.id)
      
    handleLanguageChange(lang)
    setShowDiscoveryModal(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleSRSReview = async (quality: ReviewQuality) => {
    if (!studying || !user) return

    const currentWord = studying[currentCardIndex]
    const currentInterval = currentWord.interval || 0
    const currentEase = currentWord.ease_factor || 2.5

    const { interval, ease_factor, next_review_date } = calculateSRS(quality, currentInterval, currentEase)

    await supabase
      .from("words")
      .update({ interval, ease_factor, next_review_date })
      .eq("id", currentWord.id)

    await supabase.from("study_logs").insert({
      user_id: user.id,
      word_id: currentWord.id,
      quality
    })

    setWords(words.map(w => w.id === currentWord.id ? { ...w, interval, ease_factor, next_review_date } : w))
    
    if (currentCardIndex < studying.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
    } else {
      setStudying(null)
      fetchProfile(user.id)
    }
  }

  const startStudy = () => {
    const now = new Date()
    const toReview = words.filter(w => {
      if (!w.next_review_date) return true
      return new Date(w.next_review_date) <= now
    })
    
    if (toReview.length > 0) {
      setStudying(toReview.sort(() => Math.random() - 0.5))
      setCurrentCardIndex(0)
    }
  }

  const handleAddPack = async (pack: any) => {
    if (!user) return
    
    // In a real app, you'd fetch words from this pack
    // For now, we simulate adding a word
    const { error } = await supabase
      .from("words")
      .insert({
        user_id: user.id,
        text: `New ${pack.title} Word`,
        vietnamese: "Từ mới từ thư viện",
        ipa: "/tə/ /mɔɪ/",
        definition: pack.desc,
        language: selectedLang.code,
        next_review_date: new Date().toISOString()
      })

    if (!error) {
      fetchWords(user.id, selectedLang.code)
      alert(`Đã thêm gói "${pack.title}" vào tủ từ vựng của bạn!`)
    }
  }

  const filteredWords = words.filter(w => 
    w.text.toLowerCase().includes(search.toLowerCase()) ||
    w.vietnamese.toLowerCase().includes(search.toLowerCase())
  )

  const reviewCount = words.filter(w => !w.next_review_date || new Date(w.next_review_date) <= new Date()).length

  const themeList: { id: ThemeType; gradient: string }[] = [
    { id: "monochrome", gradient: "linear-gradient(135deg, #000 50%, #fff 50%)" },
    { id: "sky", gradient: "linear-gradient(135deg, #0096FF, #E0F2FF)" },
    { id: "ebony", gradient: "linear-gradient(135deg, #111, #444)" },
    { id: "rose", gradient: "linear-gradient(135deg, #FF5E9B, #FFE0EF)" },
    { id: "gold", gradient: "linear-gradient(135deg, #B8860B, #FFFACD)" },
  ]

  const activePacks = LIBRARY_DATA[selectedLang.code] || { last_opened: [], courses: [], sets: [], videos: [] };

  const LibraryCard = ({ item, isCourse = false, isVideo = false }: { item: any, isCourse?: boolean, isVideo?: boolean }) => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-shrink-0 w-64 bg-white dark:bg-[#131f24] border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm hover:border-primary transition-all group relative overflow-hidden active:scale-95 cursor-pointer"
    >
      <div className="relative aspect-square rounded-3xl overflow-hidden mb-5">
        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest backdrop-blur-md text-white ${
          item.level === "beginner" ? "bg-emerald-500/80" : 
          item.level === "easy" ? "bg-primary/80" : "bg-blue-500/80"
        }`}>
          {item.level}
        </div>
        {(isCourse || isVideo || item.completed) && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
            <div className="w-16 h-16 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white">
              {item.completed ? <X className="text-white w-8 h-8 rotate-45" /> : (
                isCourse ? <GraduationCap className="text-white w-8 h-8" /> : <Play className="text-white w-8 h-8 fill-white" />
              )}
            </div>
          </div>
        )}
      </div>
      <div className="space-y-3">
        <h4 className="font-black text-sm uppercase italic-extra tracking-tight text-slate-800 dark:text-white line-clamp-1 h-10 flex items-center">{item.title}</h4>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black text-primary">
            {isVideo ? (
               <div className="flex items-center gap-1">
                 <Play className="w-3 h-3 fill-primary" />
                 <span className="text-[10px]">{item.duration}</span>
               </div>
            ) : (
              <div className="flex items-center gap-1">
                <LayoutGrid className="w-3 h-3" />
                <span className="text-[10px]">{item.words}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-black text-amber-500">
            <Star className="w-3 h-3 fill-amber-500" /> {item.rating}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const LibrarySection = ({ title, children, showAdd = false }: { title: string, children: React.ReactNode, showAdd?: boolean }) => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black font-display uppercase italic-extra tracking-tighter flex items-center gap-4">{title} <ArrowRight className="w-6 h-6 text-slate-300" /></h2>
        {showAdd && (
          <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors">
            <Plus className="w-5 h-5" /> <span className="text-[11px] font-black uppercase tracking-widest">{t.add}</span>
          </button>
        )}
      </div>
      <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#131f24] text-[#3c3c3c] dark:text-white transition-colors duration-500 font-sans pb-32">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary-dark/10 blur-[120px]" />
      </div>

      {/* 3-PART HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#131f24]/80 backdrop-blur-2xl border-b-2 border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex-1 flex items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center shadow-[0_4px_0_0_rgba(0,0,0,0.1)] group-hover:scale-105 active:translate-y-1 active:shadow-none transition-all">
                <GraduationCap className="text-white w-7 h-7" />
              </div>
              <span className="font-black text-2xl tracking-tighter text-primary font-display uppercase italic-extra hidden sm:block">IPA SPY</span>
            </Link>
          </div>

          <div className="flex-1 flex justify-center relative" ref={languageDropdownRef}>
            <button 
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center gap-3 px-6 py-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 rounded-full border-2 border-slate-100 dark:border-slate-800 transition-all active:scale-95 group shadow-sm"
            >
              <span className="text-xl">{selectedLang.flag}</span>
              <span className="text-xs font-black tracking-widest text-slate-600 dark:text-slate-300 uppercase">{selectedLang.name}</span>
              <ChevronDown className={`w-4 h-4 text-primary transition-transform ${showLanguageDropdown ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showLanguageDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full mt-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl py-4 min-w-[240px] z-50 overflow-hidden"
                >
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase px-6 mb-3">{t.my_languages}</p>
                  <div className="max-h-60 overflow-y-auto scrollbar-hide">
                    {unlockedLanguageCodes.map(code => {
                      const lang = ALL_LANGUAGES.find(l => l.code === code) || ALL_LANGUAGES[0];
                      return (
                        <button
                          key={code}
                          onClick={() => handleLanguageChange(lang)}
                          className={`w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${selectedLang.code === code ? "bg-primary/5 text-primary" : "text-slate-600 dark:text-slate-300"}`}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-xl">{lang.flag}</span>
                            <span className="text-xs font-black tracking-widest uppercase">{lang.name}</span>
                          </div>
                          {selectedLang.code === code && <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(88,204,2,0.5)]" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="px-4 mt-2">
                    <button 
                      onClick={() => { setShowDiscoveryModal(true); setShowLanguageDropdown(false); }}
                      className="w-full flex items-center justify-center gap-3 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary hover:bg-white dark:hover:bg-slate-700 transition-all border-2 border-transparent hover:border-primary/20"
                    >
                      <Plus className="w-4 h-4" /> {t.learn_new}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 flex items-center justify-end gap-6 text-slate-400">
             <div className="relative" ref={themePickerRef}>
                <button 
                  onClick={() => setShowThemePicker(!showThemePicker)}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center border-2 border-slate-100 dark:border-slate-800 hover:text-primary transition-all bg-white dark:bg-slate-900"
                >
                  <Palette className="w-5 h-5" />
                </button>
                <AnimatePresence>
                  {showThemePicker && (
                    <motion.div 
                      className="absolute right-0 mt-4 p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-slate-100 dark:border-slate-800 min-w-[200px]"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 px-2">Chọn chủ đề</p>
                      <div className="grid grid-cols-5 gap-3">
                        {themeList.map((t) => (
                          <button 
                            key={t.id} 
                            onClick={() => { setTheme(t.id); setShowThemePicker(false); }} 
                            className={`w-10 h-10 rounded-xl border-2 transition-all hover:scale-110 shadow-lg active:scale-95 ${theme === t.id ? "border-primary ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900" : "border-transparent opacity-80"}`} 
                            style={{ background: t.gradient }}
                            title={t.id.toUpperCase()}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
             <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 hidden sm:block" />
             <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden shadow-sm hover:border-primary transition-all">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-black text-primary">{user?.email?.[0].toUpperCase()}</span>
                )}
             </div>
             <button onClick={handleLogout} className="hover:text-rose-500 transition-colors"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {activeTab === "study" && (
            <motion.div key="study-tab" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                  <h1 className="text-6xl font-black tracking-tighter font-display uppercase italic-extra leading-[0.85] mb-6">{t.study}</h1>
                  <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-slate-100 dark:border-slate-800 w-fit">
                    {[
                      { id: "practice", label: t.practice, icon: <Play className="w-4 h-4" /> },
                      { id: "words", label: t.words, icon: <Book className="w-4 h-4" /> }
                    ].map(sub => (
                      <button key={sub.id} onClick={() => setStudySubTab(sub.id as StudySubTab)} className={`px-6 py-2.5 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all flex items-center gap-2 ${studySubTab === sub.id ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}>
                        {sub.icon} {sub.label}
                      </button>
                    ))}
                  </div>
                </div>
                {studySubTab === "words" && (
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                    <input type="text" placeholder="Tìm kiếm từ vựng..." className="pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl w-full md:w-80 outline-none focus:border-primary transition-all text-sm font-bold" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                )}
              </div>

              {studySubTab === "practice" ? (
                <div className="py-10">
                   {studying ? (
                      <div className="space-y-16">
                         <div className="flex items-center justify-between max-w-2xl mx-auto">
                            <button onClick={() => setStudying(null)} className="text-slate-300 hover:text-rose-500 font-black uppercase text-xs tracking-widest transition-colors flex items-center gap-2"><X className="w-4 h-4" /> Hủy học</button>
                            <div className="flex items-center gap-6">
                               <div className="h-3 w-48 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                  <motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: `${((currentCardIndex + 1) / studying.length) * 100}%` }} />
                               </div>
                               <span className="text-[10px] font-black text-slate-400 font-mono">{currentCardIndex + 1} / {studying.length}</span>
                            </div>
                         </div>
                         <Flashcard word={studying[currentCardIndex]} onReview={handleSRSReview} />
                      </div>
                   ) : (
                      <div className="max-w-4xl mx-auto text-center py-20 bg-white dark:bg-slate-900 rounded-[5rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl p-20 relative overflow-hidden group">
                        <div className="w-32 h-32 bg-primary rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-[0_8px_0_0_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform duration-500"><Brain className="text-white w-14 h-14" /></div>
                        <h2 className="text-6xl font-black mb-10 font-display uppercase italic-extra leading-none">{t.ready_to_study}</h2>
                        <div className="flex flex-wrap justify-center gap-8 mb-14">
                           <div className="px-10 py-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-slate-100 dark:border-slate-800">
                             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">{t.cards_due}</p>
                             <p className="text-5xl font-black text-primary font-display">{reviewCount}</p>
                           </div>
                        </div>
                        {reviewCount > 0 ? (
                           <button onClick={startStudy} className="btn-duo bg-primary text-white border-primary-dark px-20 lg:px-32 text-xl font-display">{t.start_now}</button>
                        ) : (
                           <p className="text-xl font-black text-slate-400 italic">{t.all_conquered}</p>
                        )}
                      </div>
                   )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   <AnimatePresence>
                     {filteredWords.map((word) => (
                        <motion.div layout key={word.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-10 bg-white dark:bg-slate-900/40 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 hover:border-primary/50 transition-all group relative overflow-hidden">
                           <div className="flex items-center justify-between mb-8">
                             <div>
                               <h3 className="text-3xl font-black font-display text-primary uppercase italic-extra leading-none mb-3">{word.text}</h3>
                               <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-400">{word.ipa}</span>
                             </div>
                             <button onClick={() => new Audio(word.audio).play()} className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center hover:scale-110 transition-transform"><Volume2 className="w-6 h-6" /></button>
                           </div>
                           <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-6">{word.vietnamese}</p>
                           <p className="text-sm text-slate-500 font-bold italic line-clamp-2">{word.definition}</p>
                        </motion.div>
                     ))}
                   </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "library" && (
            <motion.div key="library-tab" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-16">
               <div className="bg-gradient-to-br from-primary/5 to-transparent p-12 rounded-[5rem] border-2 border-slate-100 dark:border-slate-800 mb-20 relative overflow-hidden">
                 <div className="relative z-10">
                   <h1 className="text-8xl font-black tracking-tighter font-display uppercase italic-extra leading-[0.75] mb-6">{t.library}</h1>
                   <p className="text-slate-400 text-xl font-black uppercase tracking-[0.2em]">{selectedLang.name} MARKETPLACE</p>
                 </div>
                 <Smartphone className="absolute -right-12 -bottom-12 w-64 h-64 text-primary/5 -rotate-12" />
               </div>

               {activePacks.last_opened.length > 0 && (
                 <LibrarySection title={t.recent}>
                   {activePacks.last_opened.map(item => <LibraryCard key={item.id} item={item} />)}
                 </LibrarySection>
               )}

               <LibrarySection title={t.courses}>
                 {activePacks.courses.map(item => <LibraryCard key={item.id} item={item} isCourse />)}
               </LibrarySection>

               <LibrarySection title={t.sets} showAdd>
                 {activePacks.sets.map(item => <LibraryCard key={item.id} item={item} />)}
                 {userDecks.map(deck => (
                   <LibraryCard key={deck.id} item={{ ...deck, image: deck.thumbnail_url, words: 0 }} />
                 ))}
               </LibrarySection>

               <LibrarySection title={t.videos}>
                 {activePacks.videos.map(item => <LibraryCard key={item.id} item={item} isVideo />)}
               </LibrarySection>

               <div className="py-20 text-center border-t-2 border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">{sysLang === "VI" ? "Đang cập nhật thêm bài báo và nội dung mới..." : "More articles and content coming soon..."}</p>
               </div>
            </motion.div>
          )}

          {activeTab === "account" && (
            <motion.div key="account-tab" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-4xl mx-auto space-y-12">
               <div className="text-center space-y-8">
                  <div className="relative inline-block group">
                    <div className="w-56 h-56 rounded-[5rem] bg-slate-50 dark:bg-slate-800 p-2 border-2 border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl transition-all group-hover:scale-105">
                      {user?.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-[4.5rem]" />
                      ) : (
                        <div className="w-full h-full bg-primary flex items-center justify-center text-8xl font-black text-white rounded-[4.5rem]">
                          {user?.email?.[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-lg group-hover:rotate-12 transition-all">
                      <Palette className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-5xl font-black font-display uppercase italic-extra tracking-tighter mb-2">{profile?.display_name || user?.email?.split('@')[0]}</h2>
                    <p className="text-slate-400 font-bold tracking-widest uppercase text-sm">{user?.email}</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-12 bg-white dark:bg-slate-900 rounded-[4rem] border-2 border-slate-100 dark:border-slate-800 space-y-6 shadow-xl relative overflow-hidden group">
                     <Flame className="absolute -right-8 -top-8 w-40 h-40 text-rose-500/5 group-hover:scale-110 transition-transform" />
                     <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{sysLang === "VI" ? "Hành trình nhiệt huyết" : "Passion Journey"}</p>
                     <div className="flex items-end gap-6">
                        <span className="text-9xl font-black font-display italic-extra text-rose-500 leading-none">{profile?.streak_count || 0}</span>
                        <div className="pb-4">
                           <p className="text-2xl font-black tracking-tighter uppercase italic-extra">{sysLang === "VI" ? "Ngày liên tục" : "Day Streak"}</p>
                           <p className="text-sm font-bold text-slate-400">{sysLang === "VI" ? "Đừng để ngọn lửa vụt tắt!" : "Don't let the flame go out!"}</p>
                        </div>
                     </div>
                  </div>

                  <div className="p-12 bg-white dark:bg-slate-900 rounded-[4rem] border-2 border-slate-100 dark:border-slate-800 space-y-6 shadow-xl">
                     <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t.system_language}</p>
                     <div className="flex p-2 bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-slate-100 dark:border-slate-800">
                        <button 
                          onClick={() => { setSysLang("VI"); localStorage.setItem("systemLanguage", "VI"); }}
                          className={`flex-1 py-4 rounded-2xl text-xs font-black transition-all ${sysLang === "VI" ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-400"}`}
                        >
                          TIẾNG VIỆT
                        </button>
                        <button 
                          onClick={() => { setSysLang("EN"); localStorage.setItem("systemLanguage", "EN"); }}
                          className={`flex-1 py-4 rounded-2xl text-xs font-black transition-all ${sysLang === "EN" ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-400"}`}
                        >
                          ENGLISH
                        </button>
                     </div>
                     
                     <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-8">{t.my_languages}</p>
                     <div className="space-y-4">
                        {unlockedLanguageCodes.map(code => (
                          <div key={code} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-transparent hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-6">
                              <span className="text-3xl">{ALL_LANGUAGES.find(l => l.code === code)?.flag}</span>
                              <span className="font-black tracking-widest uppercase text-xs">{ALL_LANGUAGES.find(l => l.code === code)?.name}</span>
                            </div>
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="py-12 px-12 bg-slate-50 dark:bg-slate-800/20 rounded-[4rem] border-2 border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-center gap-12">
                  <button onClick={handleLogout} className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.3em] text-rose-500 hover:scale-110 transition-all"> ĐĂNG XUẤT <LogOut className="w-5 h-5" /></button>
                  <div className="w-2 h-2 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  <Link href="https://ipa-spy.com/privacy" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-600">Quyền riêng tư</Link>
                  <div className="w-2 h-2 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  <Link href="https://ipa-spy.com/terms" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-600">Điều khoản sử dụng</Link>
               </div>
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div key="analytics-tab" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Analytics words={words} streak={profile?.streak_count || 0} sysLang={sysLang} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* GLOBAL DISCOVERY MODAL */}
      <AnimatePresence>
        {showDiscoveryModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDiscoveryModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[4rem] flex flex-col max-h-[85vh] shadow-2xl border-2 border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-10 pb-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-black font-display uppercase italic-extra text-slate-800 dark:text-white flex items-center gap-4">
                    <Globe className="text-primary w-8 h-8" /> {t.explore_languages}
                  </h2>
                  <button onClick={() => setShowDiscoveryModal(false)} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl text-slate-400 transition-all active:scale-95"><X className="w-6 h-6" /></button>
                </div>
                
                <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-all" />
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm ngôn ngữ (Tiếng Anh, Japanese...)" 
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-transparent focus:border-primary/30 focus:bg-white dark:focus:bg-slate-850 transition-all outline-none font-bold text-sm"
                    value={discoverySearch}
                    onChange={(e) => setDiscoverySearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 pt-0 scrollbar-hide">
                <div className="space-y-3">
                  {ALL_LANGUAGES.filter(l => 
                    l.name.toLowerCase().includes(discoverySearch.toLowerCase())
                  ).map((lang) => {
                    const isUnlocked = unlockedLanguageCodes.includes(lang.code);
                    return (
                      <button 
                        key={lang.code} 
                        onClick={() => !isUnlocked && unlockLanguage(lang)}
                        className={`w-full flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all group ${
                          isUnlocked 
                          ? "bg-slate-50 dark:bg-slate-800/50 border-transparent opacity-60 cursor-default" 
                          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1"
                        }`}
                      >
                        <div className="flex items-center gap-6">
                          <span className="text-3xl group-hover:scale-110 transition-transform">{lang.flag}</span>
                          <div className="text-left">
                            <span className="block font-black tracking-widest uppercase text-xs text-slate-800 dark:text-white">{lang.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{isUnlocked ? "ĐÃ CÓ TRONG DANH SÁCH" : "BẮT ĐẦU HỌC NGAY"}</span>
                          </div>
                        </div>
                        {!isUnlocked && <Plus className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-all" />}
                        {isUnlocked && <div className="w-2 h-2 bg-primary rounded-full" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-10 pt-6 border-t-2 border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Chúng tôi đang cập nhật thêm nhiều ngôn ngữ mới hằng tuần!</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#131f24]/90 backdrop-blur-2xl border-t-2 border-slate-100 dark:border-slate-800 px-6 py-4 lg:py-6 safe-area-bottom">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {[
            { id: "study", icon: <Brain className="w-7 h-7" />, label: t.study, activeLabel: sysLang === "VI" ? "HỌC TẬP" : "STUDY" },
            { id: "library", icon: <LayoutGrid className="w-7 h-7" />, label: t.library, activeLabel: sysLang === "VI" ? "KHÁM PHÁ" : "EXPLORE" },
            { id: "analytics", icon: <BarChart3 className="w-7 h-7" />, label: t.analytics, activeLabel: sysLang === "VI" ? "THỐNG KÊ" : "STATS" },
            { id: "account", icon: <User className="w-7 h-7" />, label: t.account, activeLabel: sysLang === "VI" ? "CÁ NHÂN" : "PROFILE" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as MainTab)} className="relative group flex flex-col items-center gap-1 min-w-[70px]">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${activeTab === tab.id ? "bg-primary text-white shadow-[0_4px_0_0_rgba(0,0,0,0.15)] -translate-y-2" : "text-slate-300 hover:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>{tab.icon}</div>
              <span className={`text-[9px] font-black tracking-[0.2em] transition-all uppercase ${activeTab === tab.id ? "text-primary opacity-100" : "opacity-0 group-hover:opacity-100"}`}>{activeTab === tab.id ? tab.activeLabel : tab.label}</span>
              {activeTab === tab.id && <motion.div layoutId="activeTabDot" className="absolute -bottom-1 w-1.5 h-1.5 bg-primary rounded-full shadow-lg" />}
            </button>
          ))}
        </div>
      </nav>

      {/* CREATE DECK MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[4rem] shadow-2xl border-2 border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-12 space-y-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-4xl font-black font-display uppercase italic-extra tracking-tighter text-primary">{sysLang === "VI" ? "TẠO BỘ THẺ MỚI" : "CREATE NEW DECK"}</h2>
                  <button onClick={() => setIsCreateModalOpen(false)} className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">{sysLang === "VI" ? "Tên bộ thẻ" : "Deck Title"}</label>
                    <input 
                      type="text" 
                      placeholder={sysLang === "VI" ? "Ví dụ: Từ vựng Du lịch" : "e.g. Travel Vocabulary"}
                      value={newDeckData.title}
                      onChange={(e) => setNewDeckData({ ...newDeckData, title: e.target.value })}
                      className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-slate-100 dark:border-slate-800 focus:border-primary transition-all outline-none font-bold text-lg"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">{sysLang === "VI" ? "Mô tả (Không bắt buộc)" : "Description (Optional)"}</label>
                    <textarea 
                      placeholder={sysLang === "VI" ? "Thêm một chút mô tả cho bộ thẻ của bạn..." : "Add a short description..."}
                      value={newDeckData.description}
                      onChange={(e) => setNewDeckData({ ...newDeckData, description: e.target.value })}
                      className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-slate-100 dark:border-slate-800 focus:border-primary transition-all outline-none font-bold min-h-[120px]"
                    />
                  </div>

                  <div className="space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">{sysLang === "VI" ? "Chọn ảnh bìa" : "Choose Cover Image"}</label>
                    <div className="grid grid-cols-3 gap-4">
                      {DECK_PRESETS.map((url, i) => (
                        <button 
                          key={i} 
                          onClick={() => setNewDeckData({ ...newDeckData, thumbnail_url: url })}
                          className={`relative aspect-[4/3] rounded-2xl overflow-hidden border-4 transition-all ${newDeckData.thumbnail_url === url ? "border-primary scale-95" : "border-transparent hover:scale-105"}`}
                        >
                          <img src={url} alt="Preset" className="w-full h-full object-cover" />
                          {newDeckData.thumbnail_url === url && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"><Plus className="w-5 h-5 text-primary rotate-45" /></div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 py-5 rounded-3xl font-black uppercase tracking-widest text-xs border-2 border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    {t.cancel}
                  </button>
                  <button 
                    onClick={handleCreateDeck}
                    disabled={!newDeckData.title}
                    className="flex-[2] py-5 rounded-3xl font-black uppercase tracking-widest text-xs bg-primary text-white border-b-4 border-primary-dark hover:brightness-110 disabled:grayscale disabled:opacity-50 transition-all"
                  >
                    {sysLang === "VI" ? "TẠO NGAY" : "CREATE NOW"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .italic-extra { font-style: italic; font-weight: 900; }
        .safe-area-bottom { padding-bottom: calc(1rem + env(safe-area-inset-bottom)); }
        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </div>
  )
}
