import { useState, useRef, useEffect } from "react";

const CATEGORIES = [
  { id: "all", label: "総合", icon: "◉" },
  { id: "earnings", label: "決算", icon: "📊" },
  { id: "ma", label: "M&A", icon: "🤝" },
  { id: "policy", label: "政策・規制", icon: "🏛" },
  { id: "tech", label: "テクノロジー", icon: "⚡" },
  { id: "global", label: "海外要因", icon: "🌏" },
];

const SURGE_COLORS = {
  extreme: { bg: "#ff2d2d", text: "#fff", label: "極めて高い" },
  high: { bg: "#ff8c00", text: "#fff", label: "高い" },
  moderate: { bg: "#ffd000", text: "#1a1a1a", label: "中程度" },
  low: { bg: "#4a90d9", text: "#fff", label: "低い" },
};

function PulseRing({ color }) {
  return (
    <span style={{ position: "relative", display: "inline-block", width: 12, height: 12 }}>
      <span
        style={{
          position: "absolute", inset: 0, borderRadius: "50%", background: color,
          animation: "pulse-ring 1.8s ease-out infinite",
        }}
      />
      <span style={{ position: "absolute", inset: 2, borderRadius: "50%", background: color }} />
      <style>{`@keyframes pulse-ring { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }`}</style>
    </span>
  );
}

function NewsCard({ item, index }) {
  const [open, setOpen] = useState(false);
  const surge = SURGE_COLORS[item.surge_level] || SURGE_COLORS.moderate;

  return (
    <div
      style={{
        background: "#111113",
        border: "1px solid #222",
        borderLeft: `3px solid ${surge.bg}`,
        borderRadius: 10,
        padding: "18px 20px",
        marginBottom: 12,
        cursor: "pointer",
        transition: "all 0.2s",
        animation: `card-in 0.4s ease ${index * 0.07}s both`,
      }}
      onClick={() => setOpen(!open)}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = surge.bg; e.currentTarget.style.background = "#161618"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#222"; e.currentTarget.style.borderLeftColor = surge.bg; e.currentTarget.style.background = "#111113"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{
              background: surge.bg, color: surge.text,
              fontSize: 10, fontWeight: 700, padding: "2px 8px",
              borderRadius: 4, letterSpacing: "0.05em", textTransform: "uppercase",
            }}>
              {surge.label}
            </span>
            {item.category && (
              <span style={{ fontSize: 10, color: "#888", background: "#222", padding: "2px 7px", borderRadius: 4 }}>
                {item.category}
              </span>
            )}
            {item.tickers?.length > 0 && item.tickers.map((t, i) => (
              <span key={i} style={{ fontSize: 10, color: "#4fc3f7", fontFamily: "'JetBrains Mono', monospace" }}>{t}</span>
            ))}
          </div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#eee", lineHeight: 1.45 }}>{item.headline}</h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {item.surge_level === "extreme" && <PulseRing color={surge.bg} />}
          <span style={{ fontSize: 11, color: "#666", whiteSpace: "nowrap" }}>{item.time_info || ""}</span>
          <span style={{ color: "#555", fontSize: 14, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "0.2s" }}>▾</span>
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #222", animation: "fade-in 0.25s ease" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#aaa", lineHeight: 1.7 }}>{item.analysis}</p>
          {item.reasoning && (
            <div style={{ marginTop: 10, background: "#0a0a0c", borderRadius: 6, padding: "10px 14px" }}>
              <span style={{ fontSize: 10, color: "#666", fontWeight: 600, letterSpacing: "0.08em" }}>急騰シグナル根拠</span>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#999", lineHeight: 1.6 }}>{item.reasoning}</p>
            </div>
          )}
          {item.source && (
            <p style={{ margin: "10px 0 0", fontSize: 11, color: "#555" }}>出典: {item.source}</p>
          )}
        </div>
      )}
      <style>{`
        @keyframes card-in { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
        @keyframes fade-in { from { opacity:0; } to { opacity:1; } }
      `}</style>
    </div>
  );
}

export default function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [customQuery, setCustomQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const abortRef = useRef(null);

  const doResearch = async (category, extra = "") => {
    setLoading(true);
    setError(null);
    setResults([]);

    const catPrompts = {
      all: "日本株 急騰 材料 ニュース 最新",
      earnings: "日本株 決算 サプライズ 上方修正 最新",
      ma: "日本企業 M&A 買収 TOB 最新ニュース",
      policy: "日本 経済政策 規制緩和 株価影響 最新",
      tech: "日本 テクノロジー AI 半導体 株価 急騰 最新",
      global: "海外要因 日本株 影響 為替 米国株 最新",
    };

    const searchFocus = catPrompts[category] || catPrompts.all;
    const userExtra = extra ? `\nユーザー追加条件: ${extra}` : "";

    const systemPrompt = `あなたは日本株の急騰可能性を分析する世界最高レベルのAIアナリストです。
Web検索結果を基に、株価が急騰する可能性の高いニュースを厳選・分析してください。

以下のJSON配列のみを返してください（マークダウン記法なし、バッククォートなし）:
[
  {
    "headline": "ニュースの見出し（日本語）",
    "analysis": "なぜこのニュースが株価急騰につながるかの詳細分析（日本語、100-200字）",
    "reasoning": "急騰シグナルの根拠（過去の類似パターン、需給要因、テクニカル要因など）",
    "surge_level": "extreme|high|moderate|low のいずれか",
    "category": "カテゴリ名（決算、M&A、政策、テクノロジー、海外要因、需給など）",
    "tickers": ["関連銘柄コードまたは名前の配列"],
    "time_info": "ニュースの日時情報",
    "source": "情報源"
  }
]

重要ルール:
- 必ず5〜10件のニュースを返す
- surge_levelは客観的に判定（extremeは本当に急騰確率が極めて高いもののみ）
- 最新のニュースを優先
- 具体的な銘柄名・コードを可能な限り含める
- JSONのみ出力。前後に説明文やバッククォートを絶対に付けない`;

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: `以下のテーマで最新ニュースを検索し、日本株の急騰可能性を分析してください。\n\n検索テーマ: ${searchFocus}${userExtra}\n\n今日の日付: ${new Date().toLocaleDateString("ja-JP")}`,
            },
          ],
          tools: [{ type: "web_search_20250305", name: "web_search" }],
        }),
      });

      if (!resp.ok) throw new Error(`API error: ${resp.status}`);
      const data = await resp.json();

      const textBlocks = data.content?.filter((b) => b.type === "text").map((b) => b.text).join("\n") || "";
      const cleaned = textBlocks.replace(/```json|```/g, "").trim();

      // Try to find JSON array in the response
      let parsed;
      const arrMatch = cleaned.match(/\[[\s\S]*\]/);
      if (arrMatch) {
        parsed = JSON.parse(arrMatch[0]);
      } else {
        throw new Error("AIからの応答をパースできませんでした");
      }

      setResults(parsed);
      setLastUpdated(new Date());
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = activeCategory === "all" ? results : results.filter((r) => {
    const catMap = { earnings: "決算", ma: "M&A", policy: "政策", tech: "テクノロジー", global: "海外" };
    return r.category?.includes(catMap[activeCategory] || "");
  });

  const surgeStats = {
    extreme: results.filter((r) => r.surge_level === "extreme").length,
    high: results.filter((r) => r.surge_level === "high").length,
    moderate: results.filter((r) => r.surge_level === "moderate").length,
    low: results.filter((r) => r.surge_level === "low").length,
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#09090b", color: "#e0e0e0",
      fontFamily: "'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: "linear-gradient(180deg, #111113 0%, #09090b 100%)",
        borderBottom: "1px solid #1a1a1e",
        padding: "24px 20px 18px",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 22 }}>🔥</span>
            <h1 style={{
              margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em",
              background: "linear-gradient(135deg, #ff4d4d, #ff8c00, #ffd000)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              日本株 急騰シグナル
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: "#555", letterSpacing: "0.04em" }}>
            AI駆動リアルタイムニュース分析 — 急騰可能性の高い材料を自動検出
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px 16px 40px" }}>

        {/* Search bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doResearch(activeCategory, customQuery)}
            placeholder="追加キーワード（例: 半導体、EV、インバウンド…）"
            style={{
              flex: 1, padding: "10px 14px", background: "#111113", border: "1px solid #222",
              borderRadius: 8, color: "#ddd", fontSize: 13, outline: "none",
            }}
          />
          <button
            onClick={() => doResearch(activeCategory, customQuery)}
            disabled={loading}
            style={{
              padding: "10px 20px", borderRadius: 8, border: "none",
              background: loading ? "#333" : "linear-gradient(135deg, #ff4d4d, #ff8c00)",
              color: "#fff", fontWeight: 700, fontSize: 13, cursor: loading ? "wait" : "pointer",
              transition: "0.2s", whiteSpace: "nowrap",
            }}
          >
            {loading ? "分析中…" : "🔍 分析開始"}
          </button>
        </div>

        {/* Categories */}
        <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => { setActiveCategory(c.id); if (results.length === 0) doResearch(c.id, customQuery); }}
              style={{
                padding: "6px 12px", borderRadius: 6, border: "1px solid",
                borderColor: activeCategory === c.id ? "#ff8c00" : "#222",
                background: activeCategory === c.id ? "#1a1208" : "#111113",
                color: activeCategory === c.id ? "#ffb347" : "#888",
                fontSize: 12, cursor: "pointer", fontWeight: 500, transition: "0.15s",
              }}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        {results.length > 0 && (
          <div style={{
            display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center",
          }}>
            {Object.entries(surgeStats).filter(([, v]) => v > 0).map(([k, v]) => (
              <span key={k} style={{
                display: "flex", alignItems: "center", gap: 5, fontSize: 11,
                color: SURGE_COLORS[k].bg, fontWeight: 600,
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: SURGE_COLORS[k].bg,
                }} />
                {SURGE_COLORS[k].label}: {v}件
              </span>
            ))}
            {lastUpdated && (
              <span style={{ fontSize: 10, color: "#444", marginLeft: "auto" }}>
                更新: {lastUpdated.toLocaleTimeString("ja-JP")}
              </span>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{
              width: 40, height: 40, margin: "0 auto 16px",
              border: "3px solid #222", borderTopColor: "#ff8c00",
              borderRadius: "50%", animation: "spin 0.8s linear infinite",
            }} />
            <p style={{ color: "#888", fontSize: 13 }}>最新ニュースを検索・分析中…</p>
            <p style={{ color: "#555", fontSize: 11 }}>Web検索 → AI分析 → 急騰シグナル判定</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "#1a0a0a", border: "1px solid #3a1515", borderRadius: 8,
            padding: 16, marginBottom: 16, color: "#ff6b6b", fontSize: 13,
          }}>
            ⚠️ エラー: {error}
          </div>
        )}

        {/* Results */}
        {!loading && filtered.length > 0 && filtered.map((item, i) => (
          <NewsCard key={i} item={item} index={i} />
        ))}

        {/* Empty state */}
        {!loading && results.length === 0 && !error && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
            <p style={{ color: "#666", fontSize: 14, marginBottom: 6 }}>
              「分析開始」を押して最新の急騰シグナルを検出
            </p>
            <p style={{ color: "#444", fontSize: 12 }}>
              AIがリアルタイムでニュースを検索・分析し、株価急騰の可能性が高い材料を抽出します
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
