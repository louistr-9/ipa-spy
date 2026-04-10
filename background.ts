export {}

/**
 * IPA Spy Background Service Worker (Proxy Mode)
 * Đóng vai trò là "đầu não" xử lý mọi tác vụ nặng để tránh lỗi CSP/CORS từ trang web.
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchData") {
    handleFetchData(message.text).then(sendResponse)
    return true // Giữ kết nối để gửi response async
  }

  if (message.action === "speak") {
    handleSpeak(message.text, message.audioUrl)
    sendResponse({ status: "speaking" })
  }

  if (message.action === "saveWord") {
    handleSaveWord(message.wordData).then(sendResponse)
    return true
  }

  if (message.action === "checkSaved") {
    handleCheckSaved(message.text).then(sendResponse)
    return true
  }
})

// --- Logic xử lý Fetch Data ---
async function handleFetchData(text: string) {
  try {
    // 1. Fetch từ Dictionary API
    const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${text}`)
    const dictJson = await dictRes.json()

    // 2. Fetch từ Google Translate
    const transRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${text}`)
    const transJson = await transRes.json()
    const viMeaning = transJson?.[0]?.[0]?.[0] || "N/A"

    if (dictJson.title === "No Definitions Found" || !Array.isArray(dictJson)) {
      return { 
        success: true, 
        data: { ipa: "N/A", definition: "Not found.", vietnamese: viMeaning, example: "", audio: "" } 
      }
    }

    const entry = dictJson[0]
    const firstMeaning = entry.meanings?.[0]
    
    // Tìm audio
    let audioUrl = ""
    const phoneticsWithAudio = entry.phonetics?.filter((p: any) => p.audio) || []
    const ukAudio = phoneticsWithAudio.find((p: any) => p.audio.includes("-uk.mp3"))
    audioUrl = ukAudio?.audio || phoneticsWithAudio[0]?.audio || ""
    if (audioUrl.startsWith("//")) audioUrl = `https:${audioUrl}`

    return {
      success: true,
      data: {
        ipa: entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text || "/?/",
        definition: firstMeaning?.definitions?.[0]?.definition || "No definition.",
        vietnamese: viMeaning,
        example: firstMeaning?.definitions?.find((d: any) => d.example)?.example || "",
        audio: audioUrl
      }
    }
  } catch (error) {
    console.error("Fetch Data Error:", error)
    return { success: false, error: "Connection error" }
  }
}

// --- Logic xử lý Phát âm ---
function handleSpeak(text: string, audioUrl?: string) {
  // Nếu có audioUrl (MP3), ta không thể dùng chrome.tts trực tiếp cho URL
  // Nhưng background script có thể "mượn" một trang ẩn hoặc dùng tts dự phòng
  
  chrome.tts.stop()
  chrome.tts.speak(text, {
    lang: "en-GB",
    rate: 0.9,
    pitch: 1.0,
    voiceName: "Google UK English Female" // Thử dùng voice cụ thể nếu có
  })
}

// --- Logic xử lý Lưu trữ ---
async function handleSaveWord(wordData: any) {
  return new Promise((resolve) => {
    chrome.storage.local.get(["ipaSpyNotebook"], (result) => {
      const notebook = result.ipaSpyNotebook || []
      if (!notebook.find((item: any) => item.text === wordData.text)) {
        const updated = [wordData, ...notebook]
        chrome.storage.local.set({ ipaSpyNotebook: updated }, () => {
          resolve({ success: true, saved: true })
        })
      } else {
        resolve({ success: true, saved: true }) // Đã tồn tại
      }
    })
  })
}

async function handleCheckSaved(text: string) {
  return new Promise((resolve) => {
    chrome.storage.local.get(["ipaSpyNotebook"], (result) => {
      const notebook = result.ipaSpyNotebook || []
      const isSaved = !!notebook.find((item: any) => item.text === text)
      resolve({ isSaved })
    })
  })
}
