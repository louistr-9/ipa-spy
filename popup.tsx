import { useState, useEffect } from "react"
import { supabase } from "~core/supabase"

// --- Design Tokens ---
const TOKENS = {
  colors: {
    primary: "#6366f1", // Indigo
    primaryHover: "#4f46e5",
    background: "#f8fafc",
    surface: "#ffffff",
    text: "#0f172a",
    textMuted: "#64748b",
    border: "#e2e8f0",
    success: "#22c55e"
  },
  shadows: {
    sm: "0 1px 2px rgba(0,0,0,0.05)",
    md: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
    card: "0 10px 15px -3px rgba(0,0,0,0.08)"
  }
}

function IndexPopup() {
  const [currentView, setCurrentView] = useState("dashboard") // "dashboard" | "notebook" | "flashcards"
  const [notebook, setNotebook] = useState([])
  const [user, setUser] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [language, setLanguage] = useState("EN")

  useEffect(() => {
    refreshSession()
  }, [])

  const refreshSession = () => {
    // 1. Hỏi background (vì background là nơi thực hiện setSession)
    chrome.runtime.sendMessage({ action: "getUser" }, async (res) => {
      if (res) {
        localStorage.setItem("ipa_user", JSON.stringify(res))
        setUser(res)
        loadNotebook(res)
        setCurrentView("dashboard")
      } else {
        // 2. Dự phòng: Tự check bằng instance của chính Popup (qua storage adapter)
        const { data } = await supabase.auth.getSession()
        if (data.session?.user) {
          setUser(data.session.user)
          loadNotebook(data.session.user)
          setCurrentView("dashboard")
        }
      }
    })
  }

  const loadNotebook = async (currentUser) => {
    setSyncing(true)
    if (currentUser) {
      try {
        const { data, error } = await supabase
          .from("words")
          .select("*")
          .order("created_at", { ascending: false })
        
        if (!error && data) {
          setNotebook(data)
          chrome.storage.local.set({ ipaSpyNotebook: data })
        }
      } catch (err) {
        console.error("Fetch error:", err)
      }
    } else {
      chrome.storage.local.get(["ipaSpyNotebook"], (result) => {
        if (result.ipaSpyNotebook) setNotebook(result.ipaSpyNotebook)
      })
    }
    setSyncing(false)
  }

  const handleLogin = () => {
    chrome.runtime.sendMessage({ action: "signInWithGoogle" }, (res) => {
      if (res?.success && res.user) {
        // Cập nhật state trực tiếp để chuyển view ngay lập tức
        setUser(res.user)
        loadNotebook(res.user)
        setCurrentView("dashboard")
      } else if (res?.error) {
        alert("Lỗi đăng nhập: " + res.error)
      }
    })
  }

  const handleLogout = () => {
    chrome.runtime.sendMessage({ action: "signOut" }, () => {
      setUser(null)
      setNotebook([])
      setCurrentView("dashboard")
    })
  }

  // --- Views ---

  const LoginView = () => (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "450px",
      textAlign: "center",
      padding: "40px"
    }}>
      <div style={{ fontSize: "56px", marginBottom: "20px" }}>🕵️‍♂️</div>
      <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 10px 0", color: TOKENS.colors.text }}>IPA Spy</h1>
      <p style={{ fontSize: "15px", color: TOKENS.colors.textMuted, marginBottom: "40px", lineHeight: 1.5 }}>
        Synchronize your English progress<br/>across all your devices.
      </p>
      <button 
        onClick={handleLogin}
        style={{
          width: "100%",
          background: TOKENS.colors.text,
          color: "white",
          border: "none",
          padding: "16px",
          borderRadius: "14px",
          fontSize: "15px",
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          transition: "transform 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.96 3.16-2.12 4.36-1.52 1.52-3.8 3.24-7.84 3.24-6.44 0-11.64-5.2-11.64-11.64s5.2-11.64 11.64-11.64c3.48 0 6.08 1.36 7.92 3.12l2.32-2.32c-2.4-2.28-5.56-3.6-10.24-3.6-8.24 0-14.92 6.64-14.92 14.88s6.68 14.88 14.92 14.88c4.4 0 7.84-1.44 10.4-4.12 2.64-2.64 3.48-6.32 3.48-9.44 0-.64-.04-1.2-.12-1.72h-13.76z"/>
        </svg>
        Sign in with Google
      </button>
      <div style={{ marginTop: "24px", fontSize: "12px", color: TOKENS.colors.textMuted }}>
        No password required. Secure & Fast.
      </div>
    </div>
  )

  const DashboardView = () => (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: TOKENS.colors.primary }}>IPA SPY</div>
          <div style={{ fontSize: "11px", color: TOKENS.colors.textMuted }}>Learning English</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              border: `1px solid ${TOKENS.colors.border}`,
              fontSize: "12px",
              fontWeight: 700,
              background: "white",
              cursor: "pointer"
            }}
          >
            <option value="EN">🇺🇸 EN</option>
            <option value="CN">🇨🇳 CN</option>
            <option value="JP">🇯🇵 JP</option>
            <option value="KR">🇰🇷 KR</option>
          </select>
          <div 
            onClick={handleLogout}
            style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "14px" }}
            title="Sign Out"
          >
            🚪
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div 
          onClick={() => setCurrentView("notebook")}
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "20px",
            border: `1px solid ${TOKENS.colors.border}`,
            boxShadow: TOKENS.shadows.card,
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: "20px"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = TOKENS.colors.primary
            e.currentTarget.style.transform = "translateY(-2px)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = TOKENS.colors.border
            e.currentTarget.style.transform = "translateY(0)"
          }}
        >
          <div style={{ fontSize: "32px", width: "60px", height: "60px", background: "#e0e7ff", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            📚
          </div>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: TOKENS.colors.text }}>Kho lưu trữ</div>
            <div style={{ fontSize: "13px", color: TOKENS.colors.textMuted }}>{notebook.length} từ đã học</div>
          </div>
        </div>

        <div 
          onClick={() => setCurrentView("flashcards")}
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "20px",
            border: `1px solid ${TOKENS.colors.border}`,
            boxShadow: TOKENS.shadows.card,
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: "20px"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = TOKENS.colors.primary
            e.currentTarget.style.transform = "translateY(-2px)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = TOKENS.colors.border
            e.currentTarget.style.transform = "translateY(0)"
          }}
        >
          <div style={{ fontSize: "32px", width: "60px", height: "60px", background: "#fef3c7", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ⚡
          </div>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: TOKENS.colors.text }}>Flashcards</div>
            <div style={{ fontSize: "13px", color: "#f59e0b", fontWeight: 600 }}>Luyện tập ghi nhớ</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "40px", textAlign: "center" }}>
        <div style={{ fontSize: "12px", color: TOKENS.colors.textMuted, fontWeight: 500 }}>
          {syncing ? "Đang đồng bộ..." : "Dữ liệu đã được bảo vệ trên Cloud ✨"}
        </div>
      </div>
    </div>
  )

  const NotebookView = () => (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <button 
          onClick={() => setCurrentView("dashboard")}
          style={{ background: "#f1f5f9", border: "none", borderRadius: "10px", width: "36px", height: "36px", cursor: "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          ←
        </button>
        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800 }}>Kho lưu trữ</h2>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: "12px", fontWeight: 700, color: TOKENS.colors.textMuted }}>{notebook.length} từ</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "350px", overflowY: "auto", paddingRight: "4px" }}>
        {notebook.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: TOKENS.colors.textMuted }}>
            Chưa có từ nào được lưu.
          </div>
        ) : (
          notebook.map((item: any, idx) => (
            <div key={idx} style={{
              background: "white",
              padding: "16px",
              borderRadius: "16px",
              border: `1px solid ${TOKENS.colors.border}`,
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 800, fontSize: "17px" }}>{item.text}</span>
                <span style={{ color: TOKENS.colors.textMuted, fontSize: "13px", fontFamily: "monospace" }}>{item.ipa}</span>
              </div>
              <div style={{ fontSize: "14px", fontWeight: 600 }}>{item.vietnamese}</div>
              <div style={{ fontSize: "12px", color: TOKENS.colors.textMuted, fontStyle: "italic" }}>"{item.example}"</div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  const FlashcardsView = () => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "450px", padding: "40px", textAlign: "center" }}>
      <div style={{ fontSize: "64px", marginBottom: "20px" }}>🚧</div>
      <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 10px 0" }}>Coming Soon</h2>
      <p style={{ fontSize: "15px", color: TOKENS.colors.textMuted, lineHeight: 1.6 }}>
        Chúng tôi đang xây dựng hệ thống Flashcards thông minh giúp bạn ghi nhớ từ vựng vĩnh viễn.
      </p>
      <button 
        onClick={() => setCurrentView("dashboard")}
        style={{ marginTop: "30px", background: TOKENS.colors.primary, color: "white", border: "none", padding: "12px 24px", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}
      >
        Quay lại trang chủ
      </button>
    </div>
  )

  return (
    <div style={{
      width: "350px",
      minHeight: "450px",
      background: TOKENS.colors.background,
      fontFamily: "'Inter', system-ui, sans-serif",
      color: TOKENS.colors.text,
      userSelect: "none"
    }}>
      {!user ? (
        <LoginView />
      ) : (
        <>
          {currentView === "dashboard" && <DashboardView />}
          {currentView === "notebook" && <NotebookView />}
          {currentView === "flashcards" && <FlashcardsView />}
        </>
      )}
    </div>
  )
}

export default IndexPopup

