import type { PlasmoCSConfig } from "plasmo"
import { useState, useEffect, useCallback } from "react"

// Cấu hình để extension chạy trên tất cả các trang web
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

const IPASpyOverlay = () => {
  // 1. Khai báo state lưu trữ trạng thái
  const [selectedText, setSelectedText] = useState("")
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [data, setData] = useState({ ipa: "", definition: "", audio: "" })
  const [loading, setLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  // 2. Logic xử lý khi người dùng bôi đen từ
  const handleMouseUp = useCallback(async () => {
    const selection = window.getSelection()
    const text = selection?.toString().trim() || ""

    // Điều kiện: Dài 1-30 ký tự & CHỈ chứa chữ cái tiếng Anh
    if (text.length > 0 && text.length < 30 && /^[a-zA-Z]+$/.test(text)) {
      const range = selection!.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      setSelectedText(text)
      setPosition({
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY - 80 // Điều chỉnh khoảng cách tooltip
      })
      setIsVisible(true)
      setIsSaved(false)
      
      // 3. Gọi API tra cứu
      setLoading(true)
      try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${text}`)
        const json = await response.json()
        
        if (json.title === "No Definitions Found" || !Array.isArray(json)) {
          setData({ ipa: "N/A", definition: "Không tìm thấy định nghĩa.", audio: "" })
        } else {
          const entry = json[0]
          setData({
            ipa: entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text || "/?/",
            definition: entry.meanings?.[0]?.definitions?.[0]?.definition || "Không có định nghĩa.",
            audio: entry.phonetics?.find((p: any) => p.audio !== "")?.audio || ""
          })
        }
      } catch (error) {
        setData({ ipa: "Error", definition: "Lỗi kết nối API.", audio: "" })
      } finally {
        setLoading(false)
      }
    } else if (isVisible) {
      // Ẩn Tooltip nếu click ra ngoài hoặc bôi đen không hợp lệ
      setIsVisible(false)
    }
  }, [isVisible])

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp)
    return () => document.removeEventListener("mouseup", handleMouseUp)
  }, [handleMouseUp])

  // Hàm lưu từ vựng
  const saveWord = () => {
    if (!selectedText) return
    const wordData = { text: selectedText, ...data, timestamp: Date.now() }
    chrome.storage.local.get(["ipaSpyNotebook"], (result) => {
      const notebook = result.ipaSpyNotebook || []
      chrome.storage.local.set({ ipaSpyNotebook: [wordData, ...notebook] }, () => {
        setIsSaved(true)
      })
    })
  }

  if (!isVisible) return null

  // UI Styles (Premium Glassmorphism)
  const glassStyle: React.CSSProperties = {
    position: "absolute",
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: 2147483647,
    pointerEvents: "auto",
    transform: "translateX(-50%)",
    animation: "ipaSpyAppear 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards",
  }

  return (
    <div style={glassStyle}>
      <style>{`
        @keyframes ipaSpyAppear {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
      
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        borderRadius: "16px",
        boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.2), 0 0 15px rgba(99, 102, 241, 0.1)",
        padding: "16px",
        width: "280px",
        fontFamily: "'Inter', sans-serif",
        color: "#1e293b",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", borderBottom: "1px solid rgba(0,0,0,0.05)", paddingBottom: "8px" }}>
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: "20px", background: "linear-gradient(45deg, #4f46e5, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {selectedText}
          </h3>
          <span style={{ fontSize: "10px", fontWeight: "bold", background: "#e0e7ff", color: "#4338ca", padding: "2px 8px", borderRadius: "10px", textTransform: "uppercase" }}>IPA-Spy</span>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "12px" }}>
            <div style={{ width: "8px", height: "8px", background: "#6366f1", borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
            <span>Đang soi phiên âm...</span>
            <style>{`@keyframes pulse { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }`}</style>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#db2777", fontWeight: 600, fontSize: "14px" }}>{data.ipa}</span>
                {data.audio && (
                  <button 
                    onClick={() => new Audio(data.audio).play()}
                    style={{ border: "none", background: "none", cursor: "pointer", fontSize: "16px", padding: "4px", borderRadius: "8px", transition: "background 0.2s" }}
                    onMouseOver={(e) => e.currentTarget.style.background = "#f1f5f9"}
                    onMouseOut={(e) => e.currentTarget.style.background = "none"}
                  >
                    🔊
                  </button>
                )}
              </div>
              
              <button 
                onClick={saveWord}
                style={{
                  border: "none",
                  background: isSaved ? "#22c55e" : "#f1f5f9",
                  color: isSaved ? "white" : "#64748b",
                  padding: "4px 8px",
                  borderRadius: "8px",
                  fontSize: "10px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  transition: "all 0.2s"
                }}
              >
                {isSaved ? "✓ Đã lưu" : "Bookmark"}
              </button>
            </div>
            
            <p style={{ margin: 0, fontSize: "12px", color: "#475569", lineHeight: "1.5", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
              <strong style={{ color: "#94a3b8", fontSize: "10px", textTransform: "uppercase", marginRight: "4px" }}>Def:</strong>
              {data.definition}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default IPASpyOverlay