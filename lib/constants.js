export const HIGHLIGHT_COLORS = [
  { id: "yellow", label: "노랑", bg: "#fef9c3", border: "#fde047", text: "#854d0e" },
  { id: "green", label: "초록", bg: "#dcfce7", border: "#86efac", text: "#166534" },
  { id: "blue", label: "파랑", bg: "#dbeafe", border: "#93c5fd", text: "#1e40af" },
  { id: "pink", label: "분홍", bg: "#fce7f3", border: "#f9a8d4", text: "#9d174d" },
  { id: "orange", label: "주황", bg: "#ffedd5", border: "#fdba74", text: "#9a3412" },
  { id: "purple", label: "보라", bg: "#f3e8ff", border: "#d8b4fe", text: "#6b21a8" },
];

export const TAG_OPTIONS = [
  { id: "scaffolding", label: "스캐폴딩", color: "#3b82f6", icon: "🏗️" },
  { id: "probing", label: "탐색 질문", color: "#8b5cf6", icon: "🔍" },
  { id: "praise", label: "칭찬/격려", color: "#10b981", icon: "👏" },
  { id: "redirect", label: "방향 전환", color: "#f59e0b", icon: "↩️" },
  { id: "revision", label: "수정 제안", color: "#ef4444", icon: "✏️" },
  { id: "student-draft", label: "학생 작성", color: "#06b6d4", icon: "📝" },
  { id: "issue", label: "문제점", color: "#dc2626", icon: "⚠️" },
  { id: "good", label: "우수사례", color: "#16a34a", icon: "⭐" },
];

export function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}
