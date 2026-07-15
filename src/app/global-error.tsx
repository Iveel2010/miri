"use client";

// Root-level error boundary. Catches errors that escape every other segment
// (including the root layout) so the user never sees a bare server 500.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="mn">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "1rem",
          textAlign: "center",
          padding: "1.5rem",
          margin: 0,
        }}
      >
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
          Ямар нэгэн алдаа гарлаа
        </h1>
        <p style={{ color: "#666", maxWidth: "28rem", margin: 0 }}>
          Хуудсыг ачааллахад алдаа гарлаа. Дахин оролдож үзнэ үү.
        </p>
        <button
          onClick={reset}
          style={{
            borderRadius: "9999px",
            background: "#a87b5a",
            color: "#fff",
            border: "none",
            padding: "0.75rem 1.75rem",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Дахин оролдох
        </button>
      </body>
    </html>
  );
}
