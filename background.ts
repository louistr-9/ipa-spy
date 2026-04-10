import { supabase } from "~core/supabase"

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchData") {
    handleFetchData(message.text).then(sendResponse)
    return true
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

  if (message.action === "signInWithGoogle") {
    handleGoogleLogin().then(sendResponse)
    return true
  }

  if (message.action === "getUser") {
    supabase.auth.getUser()
      .then(({ data }) => sendResponse(data.user || null))
      .catch(err => {
        console.error("Background getUser error:", err)
        sendResponse(null)
      })
    return true
  }

  if (message.action === "signOut") {
    supabase.auth.signOut().then(() => sendResponse({ success: true }))
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
        audio: audioUrl,
        part_of_speech: firstMeaning?.partOfSpeech || "n/a"
      }
    }
  } catch (error) {
    console.error("Fetch Data Error:", error)
    return { success: false, error: "Connection error" }
  }
}

// --- Logic xử lý Phát âm ---
function handleSpeak(text: string, audioUrl?: string) {
  chrome.tts.stop()

  // Lấy danh sách voice để tìm giọng UK tốt nhất
  chrome.tts.getVoices((voices) => {
    const ukVoice = voices.find(v => v.lang.includes("en-GB"))
    const anyEnVoice = voices.find(v => v.lang.startsWith("en"))

    chrome.tts.speak(text, {
      lang: "en-GB",
      voiceName: ukVoice?.voiceName || anyEnVoice?.voiceName,
      rate: 0.9,
      pitch: 1.0
    })
  })
}

// --- Logic xử lý Google OAuth ---
async function handleGoogleLogin() {
  try {
    // 1. Lấy Redirect URL và làm sạch dấu / ở cuối nếu có
    let redirectUrl = chrome.identity.getRedirectURL()
    if (redirectUrl.endsWith("/")) {
      redirectUrl = redirectUrl.slice(0, -1)
    }
    console.log("Cleaned Redirect URL:", redirectUrl)

    // 2. Yêu cầu Supabase tạo URL đăng nhập
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
        queryParams: {
          prompt: "select_account" // Ép hiện bảng chọn tài khoản để dễ test
        }
      }
    })

    if (error) throw error
    if (!data?.url) throw new Error("Supabase không trả về URL xác thực.")

    console.log("App launching auth flow...")

    // 3. Mở cửa sổ xác thực của Chrome
    const responseUrl = await new Promise<string>((resolve, reject) => {
      chrome.identity.launchWebAuthFlow({
        url: data.url,
        interactive: true
      }, (url) => {
        if (chrome.runtime.lastError) {
          console.error("Identity Flow Error:", chrome.runtime.lastError.message)
          reject(new Error("Lỗi hệ thống Chrome: " + chrome.runtime.lastError.message))
        } else if (!url) {
          reject(new Error("Đã hủy đăng nhập hoặc không nhận được phản hồi."))
        } else {
          resolve(url)
        }
      })
    })

    console.log("Auth flow completed, parsing response...")
    const url = new URL(responseUrl)

    // Hỗ trợ cả PKCE (code) và Implicit (token)
    const hashParams = new URLSearchParams(url.hash.substring(1))
    const searchParams = new URLSearchParams(url.search)

    const access_token = hashParams.get("access_token") || searchParams.get("access_token")
    const refresh_token = hashParams.get("refresh_token") || searchParams.get("refresh_token")
    const code = searchParams.get("code")

    if (access_token) {
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token: refresh_token || ""
      })
      if (sessionError) throw sessionError
      return { success: true, user: sessionData.user }
    } else if (code) {
      // Hỗ trợ nếu Supabase dùng PKCE
      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      if (sessionError) throw sessionError
      return { success: true, user: sessionData.user }
    } else {
      throw new Error("Xác thực thành công nhưng không tìm thấy dữ liệu phiên làm việc.")
    }

  } catch (error) {
    console.error("ALARM - Auth Error:", error)
    return { success: false, error: error.message }
  }
}

// --- Logic xử lý Lưu trữ ---
async function handleSaveWord(wordData: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // 1. Lưu lên Cloud (Supabase)
      const { error } = await supabase
        .from("words")
        .upsert({
          user_id: user.id,
          text: wordData.text,
          ipa: wordData.ipa,
          definition: wordData.definition,
          vietnamese: wordData.vietnamese,
          example: wordData.example,
          audio: wordData.audio,
          context_sentence: wordData.context_sentence,
          part_of_speech: wordData.part_of_speech,
          next_review_date: new Date().toISOString(),
          interval: 0,
          ease_factor: 2.5
        }, { onConflict: "user_id,text" })

      if (error) throw error
      return { success: true, saved: true }
    } else {
      // 2. Chế độ khách (Lưu Local)
      return new Promise((resolve) => {
        chrome.storage.local.get(["ipaSpyNotebook"], (result) => {
          const notebook = result.ipaSpyNotebook || []
          const isDuplicate = notebook.some((item: any) => item.text === wordData.text)
          if (!isDuplicate) {
            const updated = [wordData, ...notebook]
            chrome.storage.local.set({ ipaSpyNotebook: updated }, () => {
              resolve({ success: true, saved: true })
            })
          } else {
            resolve({ success: true, saved: true })
          }
        })
      })
    }
  } catch (e) {
    console.error("Save Error:", e)
    return { success: false, error: e.message }
  }
}

async function handleCheckSaved(text: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data, error } = await supabase
        .from("words")
        .select("id")
        .eq("user_id", user.id)
        .eq("text", text)
        .single()

      return { isSaved: !!data }
    } else {
      return new Promise((resolve) => {
        chrome.storage.local.get(["ipaSpyNotebook"], (result) => {
          const notebook = result.ipaSpyNotebook || []
          const isSaved = notebook.some((item: any) => item.text === text)
          resolve({ isSaved })
        })
      })
    }
  } catch (e) {
    return { isSaved: false }
  }
}
