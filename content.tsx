import type { PlasmoCSConfig } from "plasmo"
import { useState, useEffect, useCallback } from "react"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

const IPASpyOverlay = () => {
  const [selectedText, setSelectedText] = useState("")
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [data, setData] = useState({ ipa: "", definition: "", vietnamese: "", example: "", audio: "" })
  const [loading, setLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const handleMouseUp = useCallback(async () => {
    const selection = window.getSelection()
    const text = selection?.toString().trim() || ""

    if (text.length > 0 && text.length < 30 && /^[a-zA-Z]+$/.test(text)) {
      const range = selection!.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      setSelectedText(text)
      setPosition({
        x: rect.left + rect.width / 2 + window.scrollX,
        y: rect.top + window.scrollY - 18 // Đẩy lên thêm 3px để nhường chỗ cho đuôi
      })
      setIsVisible(true)
      setIsSaved(false)
      
      setLoading(true)
      try {
        const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${text}`)
        const dictJson = await dictRes.json()
        
        const transRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${text}`)
        const transJson = await transRes.json()
        const viMeaning = transJson?.[0]?.[0]?.[0] || "N/A"

        if (dictJson.title === "No Definitions Found" || !Array.isArray(dictJson)) {
          setData({ ipa: "N/A", definition: "Not found.", vietnamese: viMeaning, example: "", audio: "" })
        } else {
          const entry = dictJson[0]
          const firstMeaning = entry.meanings?.[0]
          setData({
            ipa: entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text || "/?/",
            definition: firstMeaning?.definitions?.[0]?.definition || "No definition.",
            vietnamese: viMeaning,
            example: firstMeaning?.definitions?.find((d: any) => d.example)?.example || "",
            audio: entry.phonetics?.find((p: any) => p.audio !== "")?.audio || ""
          })
        }
      } catch (error) {
        setData({ ipa: "Error", definition: "Connection error.", vietnamese: "Lỗi kết nối.", example: "", audio: "" })
      } finally {
        setLoading(false)
      }
    } else if (isVisible) {
      setIsVisible(false)
    }
  }, [isVisible])

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp)
    return () => document.removeEventListener("mouseup", handleMouseUp)
  }, [handleMouseUp])

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

  const glassStyle: React.CSSProperties = {
    position: "absolute",
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: 2147483647,
    pointerEvents: "auto",
    transform: "translate(-50%, -100%)",
    animation: "ipaSpyAppear 0.3s cubic-bezier(0.23, 1, 0.32, 1) forwards",
  }

  return (
    <div style={glassStyle}>
      <style>{`
        @keyframes ipaSpyAppear {
          from { opacity: 0; transform: translate(-50%, -95%) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, -100%) scale(1); }
        }
        .ipa-spy-container::after {
          content: "";
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-top: 10px solid rgba(255, 255, 255, 0.95);
          filter: drop-shadow(0 5px 10px rgba(0,0,0,0.1));
        }
      `}</style>
      
      <div className="ipa-spy-container" style={{
        backgroundColor: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.6)",
        borderRadius: "22px",
        boxShadow: `
          0 10px 40px -10px rgba(0, 0, 0, 0.25), 
          0 0 20px rgba(99, 102, 241, 0.15),
          inset 0 0 0 1px rgba(255, 255, 255, 0.5)
        `,
        padding: "20px",
        width: "300px",
        fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
        color: "#1e293b",
        position: "relative",
      }}>
        {/* Header - Word & VN */}
        <div style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: "24px", letterSpacing: "-0.5px", background: "linear-gradient(135deg, #6366f1, #d946ef)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {selectedText}
              </h3>
              {!loading && (
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#4f46e5", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "12px", background: "#f0f2ff", color: "#6366f1", padding: "1px 6px", borderRadius: "6px", border: "1px solid #e0e7ff" }}>VN</span>
                  {data.vietnamese}
                </div>
              )}
            </div>
            <span style={{ fontSize: "10px", fontWeight: 900, background: "linear-gradient(45deg, #ec4899, #f43f5e)", color: "white", padding: "2px 10px", borderRadius: "20px", boxShadow: "0 4px 10px rgba(236,72,153,0.3)", textTransform: "uppercase" }}>IPA</span>
          </div>
        </div>

        {loading ? (
          <div style={{ height: "80px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <div style={{ width: "28px", height: "28px", border: "3px solid rgba(99, 102, 241, 0.1)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s cubic-bezier(0.5, 0, 0.5, 1) infinite" }} />
            <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, letterSpacing: "1px" }}>ANALYZING...</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* IPA & Controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(99, 102, 241, 0.04)", padding: "10px 14px", borderRadius: "14px", border: "1px solid rgba(99, 102, 241, 0.08)" }}>
              <span style={{ color: "#7c3aed", fontWeight: 700, fontSize: "15px", fontFamily: "'Fira Code', monospace" }}>{data.ipa}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                {data.audio && (
                  <button onClick={() => new Audio(data.audio).play()} style={{ border: "none", background: "white", cursor: "pointer", fontSize: "16px", padding: "6px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", transition: "transform 0.1s" }} onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.9)"} onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}>🔊</button>
                )}
                <button onClick={saveWord} style={{ border: "none", background: isSaved ? "#22c55e" : "#6366f1", color: "white", padding: "6px 14px", borderRadius: "10px", fontSize: "12px", cursor: "pointer", fontWeight: 800, transition: "all 0.2s", boxShadow: isSaved ? "0 4px 12px rgba(34,197,94,0.3)" : "0 4px 12px rgba(99,102,241,0.3)" }}>
                  {isSaved ? "Saved" : "Save"}
                </button>
              </div>
            </div>
            
            {/* English Definition */}
            <div style={{ position: "relative" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: "1.6", paddingLeft: "12px", borderLeft: "3px solid #6366f1" }}>
                {data.definition}
              </p>
            </div>

            {/* Example Usage */}
            {data.example && (
              <div style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic", background: "linear-gradient(to right, #f8fafc, #f1f5f9)", padding: "12px", borderRadius: "14px", borderLeft: "1px solid rgba(0,0,0,0.03)" }}>
                <span style={{ fontWeight: 800, fontStyle: "normal", color: "#94a3b8", fontSize: "9px", textTransform: "uppercase", display: "block", marginBottom: "4px", letterSpacing: "1px" }}>Example</span>
                "{data.example}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default IPASpyOverlay

