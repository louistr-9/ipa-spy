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
    chrome.storage.local.set({ ipaSpyNotebook: [] }, () => {
      setNotebook([])
    })
  }

  return (
    <div style={{
      width: "320px",
      minHeight: "400px",
      padding: "20px",
      background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 800, background: "linear-gradient(45deg, #4f46e5, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          IPA-Spy
        </h2>
        {notebook.length > 0 && (
          <button 
            onClick={clearNotebook}
            style={{ fontSize: "10px", color: "#ef4444", border: "none", background: "none", cursor: "pointer", fontWeight: "bold" }}
          >
            Xóa hết
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {notebook.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>📖</div>
            <p style={{ fontSize: "14px", margin: 0 }}>Chưa có từ vựng nào được lưu.</p>
            <p style={{ fontSize: "12px" }}>Hãy bôi đen từ trên web để bắt đầu soi!</p>
          </div>
        ) : (
          notebook.map((item: any, idx) => (
            <div key={idx} style={{
              background: "white",
              padding: "12px",
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              border: "1px solid rgba(0,0,0,0.02)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontWeight: 700, color: "#1e293b" }}>{item.text}</span>
                <span style={{ color: "#db2777", fontSize: "12px", fontWeight: 500 }}>{item.ipa}</span>
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
                {item.definition}
              </p>
            </div>
          ))
        )}
      </div>
      
      <div style={{ marginTop: "20px", borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: "12px", textAlign: "center" }}>
        <a 
          href="https://github.com/louistr-9/ipa-spy" 
          target="_blank" 
          style={{ fontSize: "10px", color: "#94a3b8", textDecoration: "none" }}
        >
          View on GitHub
        </a>
      </div>
    </div>
  )
}

export default IndexPopup

