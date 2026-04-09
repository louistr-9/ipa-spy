import type { PlasmoCSConfig } from "plasmo"
import { useState, useEffect } from "react"

// Cấu hình để extension chạy trên tất cả các trang web
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

const IPASpyOverlay = () => {
  const [selectedText, setSelectedText] = useState("")
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection()
      const text = selection.toString().trim()

      // Chỉ xử lý nếu là một từ (thường dưới 30 ký tự)
      if (text.length > 0 && text.length < 30) {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()

        setSelectedText(text)
        // Tính toán vị trí để hiện ngay trên từ được chọn
        setPosition({
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY - 45 // Nhảy lên trên 45px
        })
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    // Lắng nghe sự kiện nhả chuột (mouseup)
    document.addEventListener("mouseup", handleMouseUp)
    return () => document.removeEventListener("mouseup", handleMouseUp)
  }, [])

  if (!isVisible) return null

  return (
    <div
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 2147483647, // Số lớn nhất để luôn nằm trên cùng
        transform: "translateX(-20%)", // Căn chỉnh lại một chút cho đẹp
      }}
    >
      <div className="flex flex-col bg-white border border-blue-200 shadow-2xl rounded-lg p-3 min-w-[120px] animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-blue-600 text-lg">{selectedText}</span>
          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 rounded-full font-bold">IPA-Spy</span>
        </div>
        
        {/* Sau này mình sẽ thay đoạn "Loading..." này bằng kết quả từ API */}
        <div className="text-sm text-gray-600 italic border-t pt-1">
          🔍 Đang tra cứu...
        </div>
      </div>
    </div>
  )
}

export default IPASpyOverlay