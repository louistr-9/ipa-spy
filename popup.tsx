import { useState, useEffect } from "react"

function IndexPopup() {
  const [notebook, setNotebook] = useState([])

  useEffect(() => {
    // Lấy danh sách từ đã lưu từ storage
    chrome.storage.local.get(["ipaSpyNotebook"], (result) => {
      if (result.ipaSpyNotebook) {
        setNotebook(result.ipaSpyNotebook)
      }
    })
  }, [])

  const clearNotebook = () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ từ vựng?")) {
      chrome.storage.local.set({ ipaSpyNotebook: [] }, () => {
        setNotebook([])
      })
    }
  }

  return (
    <div style={{
      width: "350px",
      minHeight: "450px",
      padding: "24px",
      background: "#ffffff",
      fontFamily: "'Inter', system-ui, sans-serif",
      color: "#0f172a"
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em" }}>
          IPA Spy <span style={{ color: "#94a3b8", fontWeight: 400 }}>Notebook</span>
        </h2>
        {notebook.length > 0 && (
          <button 
            onClick={clearNotebook}
            style={{ fontSize: "11px", color: "#94a3b8", border: "1.5px solid #e2e8f0", background: "none", cursor: "pointer", fontWeight: 700, padding: "4px 10px", borderRadius: "6px", transition: "all 0.2s" }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "#ef4444"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
          >
            Clear
          </button>
        )}
      </div>

      {/* List Container */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {notebook.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>📖</div>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "#64748b", margin: "0 0 4px 0" }}>Empty Notebook</p>
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>Highlight words on any website to start saving!</p>
          </div>
        ) : (
          notebook.map((item: any, idx) => (
            <div key={idx} style={{
              background: "#ffffff",
              padding: "18px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "18px", letterSpacing: "-0.01em" }}>{item.text}</span>
                <span style={{ color: "#475569", fontSize: "13px", fontWeight: 600, fontFamily: "monospace", background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px" }}>{item.ipa}</span>
              </div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "10px", background: "#f1f5f9", color: "#64748b", padding: "1px 4px", borderRadius: "3px" }}>VN</span>
                {item.vietnamese}
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: "1.6", borderLeft: "2px solid #f1f5f9", paddingLeft: "12px" }}>
                {item.definition}
              </p>
              {item.example && (
                <div style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic", background: "#f8fafc", padding: "8px 12px", borderRadius: "6px" }}>
                  "{item.example}"
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Footer */}
      <div style={{ marginTop: "32px", borderTop: "1px solid #f1f5f9", paddingTop: "16px", textAlign: "center" }}>
        <a 
          href="https://github.com/louistr-9/ipa-spy" 
          target="_blank" 
          style={{ fontSize: "11px", color: "#cbd5e1", textDecoration: "none", fontWeight: 600, letterSpacing: "0.025em" }}
        >
          IPA SPY VERSION 1.0
        </a>
      </div>
    </div>
  )
}

export default IndexPopup

