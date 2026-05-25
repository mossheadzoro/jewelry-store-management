"use client"

export default function PrintButton() {
  return (
    <button
      style={{
        width: "100%",
        marginTop: 10,
        padding: 8,
        cursor: "pointer",
      }}
      onClick={() => window.print()}
    >
      Print
    </button>
  )
}
