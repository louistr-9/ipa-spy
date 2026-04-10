export {}

/**
 * IPA Spy Background Service Worker
 * Handles TTS (Text-to-Speech) requests to ensure stable audio across all sites.
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "speak") {
    const { text, lang = "en-GB" } = message
    
    // Stop any current speech before starting new one
    chrome.tts.stop()
    
    chrome.tts.speak(text, {
      lang: lang,
      rate: 0.95,
      pitch: 1.0,
      onEvent: (event) => {
        if (event.type === "error") {
          console.error("TTS Error:", event.errorMessage)
        }
      }
    })
    
    sendResponse({ status: "speaking" })
  }
  return true
})
