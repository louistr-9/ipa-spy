import type { PlasmoCSConfig } from "plasmo"
import { useState, useEffect, useCallback, useRef } from "react"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

const IPASpyOverlay = () => {
  const [selectedText, setSelectedText] = useState("")
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [data, setData] = useState({ ipa: "", definition: "", vietnamese: "", example: "", audio: "" })
  const [isSaved, setIsSaved] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const dataRef = useRef(data)
  useEffect(() => { dataRef.current = data }, [data])

  const playUKAudio = useCallback(() => {
    // Ưu tiên dùng MP3 nếu có, không thì dùng TTS qua background
    chrome.runtime.sendMessage({ action: "speak", text: selectedText, audioUrl: data.audio })
  }, [selectedText, data.audio])

  const getContextSentence = (selection: Selection) => {
    try {
      const range = selection.getRangeAt(0)
      const container = range.commonAncestorContainer
      const text = container.textContent || ""
      const fullText = container.parentElement?.innerText || text
      
      const selectedWord = selection.toString().trim()
      const startIndex = fullText.indexOf(selectedWord)
      
      if (startIndex === -1) return ""

      let start = startIndex
      while (start > 0 && !/[.!?\n]/.test(fullText[start - 1])) {
        start--
      }

      let end = startIndex + selectedWord.length
      while (end < fullText.length && !/[.!?\n]/.test(fullText[end])) {
        end++
      }

      const sentence = fullText.substring(start, end).trim()
      return sentence.length < 300 ? sentence : sentence.substring(0, 300) + "..."
    } catch (e) {
      return ""
    }
  }

  const handleMouseUp = useCallback(async () => {
    const selection = window.getSelection()
    const text = selection?.toString().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") || ""

    if (text.length > 0 && text.length < 50 && /^[a-zA-Z\s]+$/.test(text) && selection) {
      const context = getContextSentence(selection)
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      setSelectedText(text)
      setPosition({
        x: rect.left + rect.width / 2 + window.scrollX,
        y: rect.top + window.scrollY - 20
      })
      setIsVisible(true)
      setIsSaved(false)
      
      setFetching(true)
      try {
        chrome.runtime.sendMessage({ action: "fetchData", text }, (response) => {
          if (response && response.success) {
            setData({ ...response.data, context_sentence: context })
            chrome.runtime.sendMessage({ action: "checkSaved", text }, (checkRes) => {
              if (checkRes?.isSaved) setIsSaved(true)
            })
          } else {
            setData({ ipa: "N/A", definition: "Could not fetch details.", vietnamese: "Không tìm thấy kết quả.", example: "", audio: "", context_sentence: context })
          }
          setFetching(false)
        })
      } catch (error) {
        setFetching(false)
      }
    } else if (isVisible) {
      setIsVisible(false)
    }
  }, [isVisible])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isVisible && e.key.toLowerCase() === "s") {
        e.preventDefault()
        playUKAudio()
      }
    }
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleMouseUp, isVisible, playUKAudio])

  const saveWord = () => {
    if (!selectedText || isSaved || saving) return
    const currentData = dataRef.current
    const wordData = { text: selectedText, ...currentData, timestamp: Date.now() }
    
    setSaving(true)
    chrome.runtime.sendMessage({ action: "saveWord", wordData }, (response) => {
      if (response && response.success) {
        setIsSaved(true)
      }
      setSaving(false)
    })
  }

  if (!isVisible) return null

  const modalStyle: React.CSSProperties = {
    position: "absolute",
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: 2147483647,
    pointerEvents: "auto",
    transform: "translate(-50%, -100%)",
    animation: "ipaSpyFadeUp 0.2s ease-out forwards",
  }

  return (
    <div style={modalStyle}>
      <style>{`
        @keyframes ipaSpyFadeUp {
          from { opacity: 0; transform: translate(-50%, -98%); }
          to { opacity: 1; transform: translate(-50%, -100%); }
        }
        .ipa-spy-container::after {
          content: "";
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-top: 10px solid #ffffff;
        }
      `}</style>
      
      <div className="ipa-spy-container" style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
        padding: "20px",
        width: "300px",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#0f172a",
        position: "relative"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.025em" }}>
              {selectedText}
            </h1>
            {!fetching && (
              <div style={{ marginTop: "4px", fontSize: "14px", fontWeight: 600, color: "#334155" }}>
                {data.vietnamese}
              </div>
            )}
          </div>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", border: "1.5px solid #e2e8f0", padding: "2px 8px", borderRadius: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            IPA
          </div>
        </div>

        {fetching ? (
          <div style={{ padding: "20px 0", textAlign: "center", color: "#94a3b8", fontSize: "12px", letterSpacing: "0.05em" }}>
            LOADING...
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", color: "#475569", fontWeight: 600, fontSize: "14px", fontFamily: "monospace", flex: 1 }}>
                {data.ipa}
              </div>
              <button 
                onClick={playUKAudio}
                className="ipa-spy-btn"
                style={{ background: "#f1f5f9", border: "none", cursor: "pointer", padding: "8px 12px", borderRadius: "8px", display: "flex", alignItems: "center", transition: "background 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#e2e8f0"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#f1f5f9"}
                title="Speak (Press 'S')"
              >
                🔊
              </button>
              <button 
                onClick={saveWord}
                disabled={saving || isSaved}
                style={{ 
                  background: isSaved ? "#22c55e" : (saving ? "#94a3b8" : "#0f172a"), 
                  color: "white", 
                  border: "none", 
                  padding: "8px 16px", 
                  borderRadius: "8px", 
                  fontSize: "12px", 
                  cursor: (isSaved || saving) ? "default" : "pointer", 
                  fontWeight: 700, 
                  display: "flex", 
                  alignItems: "center", 
                  transition: "all 0.2s",
                  minWidth: "80px",
                  justifyContent: "center"
                }}
              >
                {saving ? "Saving..." : (isSaved ? "✓ Saved" : "Save")}
              </button>
            </div>
            
            <div style={{ fontSize: "13px", color: "#475569", lineHeight: "1.6", borderLeft: "2px solid #e2e8f0", paddingLeft: "12px" }}>
              {data.definition}
            </div>

            {data.example && (
              <div style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic", background: "#f8fafc", padding: "12px", borderRadius: "10px" }}>
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




