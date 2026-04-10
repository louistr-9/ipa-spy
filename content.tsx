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
        y: rect.top + window.scrollY - 15
      })
      setIsVisible(true)
      setIsSaved(false)
      
      setLoading(true)
      try {
        // 1. Fetch IPA & English Definition
        const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${text}`)
        const dictJson = await dictRes.json()
        
        // 2. Fetch Vietnamese Translation
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
    animation: "ipaSpyAppear 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards",
  }

  return (
    <div style={glassStyle}>
      <style>{`
        @keyframes ipaSpyAppear {
          from { opacity: 0; transform: translate(-50%, -90%); }
          to { opacity: 1; transform: translate(-50%, -100%); }
        }
        .ipa-spy-container::after {
          content: "";
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid rgba(255, 255, 255, 0.85);
          filter: drop-shadow(0 4px 4px rgba(0,0,0,0.1));
        }
      `}</style>
      
      <div className="ipa-spy-container" style={{
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255, 255, 255, 0.4)",
        borderRadius: "18px",
        boxShadow: "0 15px 35px -5px rgba(0, 0, 0, 0.2), 0 0 20px rgba(99, 102, 241, 0.1)",
        padding: "16px",
        width: "280px",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#1e293b",
        position: "relative"
      }}>
        {/* Header with Word & Vietnamese Meaning */}
        <div style={{ marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: "22px", background: "linear-gradient(90deg, #4f46e5, #9333ea)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {selectedText}
            </h3>
            <span style={{ fontSize: "10px", fontWeight: 800, background: "#fdf2f8", color: "#db2777", padding: "2px 8px", borderRadius: "8px", border: "1px solid #fce7f3" }}>IPA</span>
          </div>
          {!loading && (
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#4f46e5", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>🇻🇳</span>
              {data.vietnamese}
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ height: "60px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "24px", height: "24px", border: "3px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* IPA & Audio */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(99, 102, 241, 0.05)", padding: "6px 10px", borderRadius: "10px" }}>
              <span style={{ color: "#7c3aed", fontWeight: 600, fontSize: "14px", fontFamily: "monospace" }}>{data.ipa}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                {data.audio && (
                  <button onClick={() => new Audio(data.audio).play()} style={{ border: "none", background: "white", cursor: "pointer", fontSize: "14px", padding: "4px 8px", borderRadius: "6px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>🔊</button>
                )}
                <button onClick={saveWord} style={{ border: "none", background: isSaved ? "#22c55e" : "#6366f1", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", cursor: "pointer", fontWeight: 700 }}>
                  {isSaved ? "Saved" : "Save"}
                </button>
              </div>
            </div>
            
            {/* English Definition */}
            <p style={{ margin: 0, fontSize: "12px", color: "#475569", lineHeight: "1.5", borderLeft: "3px solid #e2e8f0", paddingLeft: "8px" }}>
              {data.definition}
            </p>

            {/* Example Usage */}
            {data.example && (
              <div style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic", background: "#f8fafc", padding: "6px 10px", borderRadius: "8px" }}>
                <span style={{ fontWeight: 700, fontStyle: "normal", color: "#94a3b8", fontSize: "9px", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>Example</span>
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
