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
  const [loading, setLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  
  const dataRef = useRef(data)
  useEffect(() => { dataRef.current = data }, [data])

  const playUKAudio = useCallback(() => {
    const currentData = dataRef.current
    if (currentData.audio) {
      const audio = new Audio(currentData.audio)
      audio.play().catch(() => requestBackgroundTTS(selectedText))
    } else {
      requestBackgroundTTS(selectedText)
    }
  }, [selectedText])

  const requestBackgroundTTS = (text: string) => {
    // Ưu tiên dùng Browser Speech API trực tiếp với giọng UK nếu tìm thấy
    const voices = window.speechSynthesis.getVoices()
    const ukVoice = voices.find(v => v.lang === "en-GB" || v.lang.startsWith("en-GB"))
    
    if (ukVoice) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.voice = ukVoice
      utterance.lang = "en-GB"
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    } else {
      // Nếu không, gửi tới background tts
      chrome.runtime.sendMessage({ action: "speak", text, lang: "en-GB" })
    }
  }

  const handleMouseUp = useCallback(async () => {
    const selection = window.getSelection()
    const text = selection?.toString().trim() || ""

    if (text.length > 0 && text.length < 30 && /^[a-zA-Z]+$/.test(text)) {
      const range = selection!.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      setSelectedText(text)
      setPosition({
        x: rect.left + rect.width / 2 + window.scrollX,
        y: rect.top + window.scrollY - 20
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
          
          let audioUrl = ""
          const phoneticsWithAudio = entry.phonetics?.filter((p: any) => p.audio) || []
          const ukAudio = phoneticsWithAudio.find((p: any) => p.audio.includes("-uk.mp3"))
          audioUrl = ukAudio?.audio || phoneticsWithAudio[0]?.audio || ""
          if (audioUrl.startsWith("//")) audioUrl = `https:${audioUrl}`

          const newData = {
            ipa: entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text || "/?/",
            definition: firstMeaning?.definitions?.[0]?.definition || "No definition.",
            vietnamese: viMeaning,
            example: firstMeaning?.definitions?.find((d: any) => d.example)?.example || "",
            audio: audioUrl
          }
          setData(newData)

          // Kiểm tra xem từ này đã được lưu chưa
          chrome.storage.local.get(["ipaSpyNotebook"], (result) => {
            const notebook = result.ipaSpyNotebook || []
            if (notebook.find((item: any) => item.text === text)) {
              setIsSaved(true)
            }
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isVisible && e.key.toLowerCase() === "s") {
        e.preventDefault()
        playUKAudio()
      }
    }
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("keydown", handleKeyDown)
    // Tải trước voices cho speechSynthesis
    window.speechSynthesis.getVoices()
    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleMouseUp, isVisible, playUKAudio])

  const saveWord = () => {
    if (!selectedText) return
    const currentData = dataRef.current
    const wordData = { text: selectedText, ...currentData, timestamp: Date.now() }
    
    chrome.storage.local.get(["ipaSpyNotebook"], (result) => {
      const notebook = result.ipaSpyNotebook || []
      // Check for duplicates
      if (!notebook.find((item: any) => item.text === selectedText)) {
        chrome.storage.local.set({ ipaSpyNotebook: [wordData, ...notebook] }, () => {
          setIsSaved(true)
        })
      } else {
        setIsSaved(true)
      }
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
            {!loading && (
              <div style={{ marginTop: "4px", fontSize: "14px", fontWeight: 600, color: "#334155" }}>
                {data.vietnamese}
              </div>
            )}
          </div>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", border: "1.5px solid #e2e8f0", padding: "2px 8px", borderRadius: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            IPA
          </div>
        </div>

        {loading ? (
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
                style={{ background: isSaved ? "#22c55e" : "#0f172a", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", transition: "all 0.2s" }}
              >
                {isSaved ? "✓ Saved" : "Save"}
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



