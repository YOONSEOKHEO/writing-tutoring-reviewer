"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  HIGHLIGHT_COLORS,
  TAG_OPTIONS,
  formatTime,
} from "@/lib/constants";

// ── Name prompt: 처음 접속 시 이름 입력 ──
function useReviewerName() {
  const [name, setName] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("reviewer_name");
    if (stored) setName(stored);
  }, []);

  const saveName = (n) => {
    localStorage.setItem("reviewer_name", n);
    setName(n);
  };

  return [name, saveName];
}

function NamePrompt({ onSubmit }) {
  const [input, setInput] = useState("");
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
        <h2 className="text-lg font-extrabold text-slate-900 mb-2">
          리뷰어 이름 입력
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          코멘트에 표시될 이름을 입력해주세요.
        </p>
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) onSubmit(input.trim());
          }}
          placeholder="예: 김교수, TA홍길동"
          className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
        />
        <button
          onClick={() => input.trim() && onSubmit(input.trim())}
          disabled={!input.trim()}
          className="w-full bg-blue-600 text-white rounded-lg py-3 text-sm font-bold
                     hover:bg-blue-700 disabled:bg-slate-300 transition-colors"
        >
          시작하기
        </button>
      </div>
    </div>
  );
}

// ── Utterance Row ──
function UtteranceRow({
  item,
  highlight,
  itemTags,
  itemComments,
  isOpen,
  onOpen,
  onSetHighlight,
  onToggleTag,
  onAddComment,
  onDeleteComment,
  reviewerName,
}) {
  const [commentText, setCommentText] = useState("");
  const [showInput, setShowInput] = useState(false);
  const isAI = item.speaker === "A";
  const hl = highlight
    ? HIGHLIGHT_COLORS.find((c) => c.id === highlight.color)
    : null;

  return (
    <div
      onClick={() => onOpen(item.seq)}
      className={`flex gap-0 py-3 border-b border-slate-100 cursor-pointer transition-colors
        ${hl ? "" : isOpen ? "bg-slate-50/50" : "hover:bg-slate-50/30"}`}
      style={{
        background: hl ? hl.bg : undefined,
        borderLeft: hl ? `4px solid ${hl.border}` : "4px solid transparent",
        paddingLeft: "8px",
      }}
    >
      {/* Time */}
      <div className="w-14 shrink-0 text-[11px] text-slate-400 pt-1 font-mono text-right pr-2.5">
        {formatTime(item.start_time)}
      </div>

      {/* Speaker badge */}
      <div className="w-8 shrink-0 pt-0.5">
        <span
          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold font-mono
            ${isAI ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
        >
          {isAI ? "AI" : "B"}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 pl-2 min-w-0">
        <div className="text-sm leading-7 text-slate-800 break-keep">
          {item.utterance}
        </div>

        {/* Compact badges */}
        {!isOpen &&
          (highlight || itemTags.length > 0 || itemComments.length > 0) && (
            <div className="flex gap-1 mt-1 flex-wrap items-center">
              {highlight && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-md text-white font-semibold"
                  style={{ background: hl?.border }}
                >
                  ● {highlight.reviewer_name}
                </span>
              )}
              {itemTags.map((t) => {
                const tag = TAG_OPTIONS.find((o) => o.id === t.tag);
                return tag ? (
                  <span
                    key={t.id}
                    className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold"
                    style={{
                      background: `${tag.color}18`,
                      color: tag.color,
                    }}
                  >
                    {tag.icon}
                  </span>
                ) : null;
              })}
              {itemComments.length > 0 && (
                <span className="text-[10px] text-amber-600">
                  💬 {itemComments.length}
                </span>
              )}
            </div>
          )}

        {/* Expanded panel */}
        {isOpen && (
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            {/* Highlight */}
            <div className="flex gap-1 mb-2 items-center">
              <span className="text-[11px] text-slate-400 mr-1 font-semibold">
                형광펜:
              </span>
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() =>
                    onSetHighlight(
                      item.seq,
                      highlight?.color === c.id ? null : c.id
                    )
                  }
                  className="w-5 h-5 rounded transition-all"
                  style={{
                    background: c.bg,
                    border:
                      highlight?.color === c.id
                        ? `2px solid ${c.text}`
                        : "2px solid #e2e8f0",
                  }}
                  title={c.label}
                />
              ))}
              {highlight && (
                <span className="text-[10px] text-slate-400 ml-1">
                  by {highlight.reviewer_name}
                </span>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-2">
              {TAG_OPTIONS.map((tag) => {
                const active = itemTags.some((t) => t.tag === tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => onToggleTag(item.seq, tag.id)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-[11px] transition-all"
                    style={{
                      border: `1.5px solid ${active ? tag.color : "#e2e8f0"}`,
                      background: active ? `${tag.color}15` : "#fff",
                      color: active ? tag.color : "#94a3b8",
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    <span>{tag.icon}</span>
                    {tag.label}
                  </button>
                );
              })}
            </div>

            {/* Comments */}
            {itemComments.map((c) => (
              <div
                key={c.id}
                className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-1 text-[13px]"
              >
                <div className="flex justify-between items-start">
                  <div className="leading-relaxed flex-1">{c.text}</div>
                  {c.reviewer_name === reviewerName && (
                    <button
                      onClick={() => onDeleteComment(c.id)}
                      className="text-red-400 hover:text-red-600 text-[11px] ml-2 shrink-0"
                    >
                      삭제
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  — {c.reviewer_name} ·{" "}
                  {new Date(c.created_at).toLocaleDateString("ko-KR")}
                </div>
              </div>
            ))}

            {/* Add comment */}
            {showInput ? (
              <div className="mt-1">
                <textarea
                  autoFocus
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="코멘트를 입력하세요..."
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      (e.metaKey || e.ctrlKey) &&
                      commentText.trim()
                    ) {
                      onAddComment(item.seq, commentText.trim());
                      setCommentText("");
                      setShowInput(false);
                    }
                  }}
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg p-2 text-[13px] 
                             focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
                />
                <div className="flex gap-1 mt-1">
                  <button
                    onClick={() => {
                      if (commentText.trim()) {
                        onAddComment(item.seq, commentText.trim());
                        setCommentText("");
                        setShowInput(false);
                      }
                    }}
                    className="bg-blue-600 text-white rounded-lg px-3 py-1 text-[12px] font-semibold hover:bg-blue-700"
                  >
                    등록 (⌘+Enter)
                  </button>
                  <button
                    onClick={() => {
                      setShowInput(false);
                      setCommentText("");
                    }}
                    className="bg-slate-100 rounded-lg px-3 py-1 text-[12px] hover:bg-slate-200"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowInput(true)}
                className="mt-1 border border-dashed border-slate-300 rounded-lg px-3 py-1 
                           text-[12px] text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
              >
                + 코멘트 추가
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Review Client ──
export default function ReviewClient({ initialData }) {
  const { session, utterances } = initialData;
  const [reviewerName, setReviewerName] = useReviewerName();
  const [highlights, setHighlights] = useState(initialData.highlights);
  const [tags, setTags] = useState(initialData.tags);
  const [comments, setComments] = useState(initialData.comments);
  const [globalNote, setGlobalNote] = useState(
    initialData.globalNotes?.[0]?.text || ""
  );
  const [openId, setOpenId] = useState(null);
  const [filterSpeaker, setFilterSpeaker] = useState(null);
  const [filterTag, setFilterTag] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  // Group annotations by utterance seq
  const highlightMap = useMemo(() => {
    const m = {};
    highlights.forEach((h) => (m[h.utterance_seq] = h));
    return m;
  }, [highlights]);

  const tagMap = useMemo(() => {
    const m = {};
    tags.forEach((t) => {
      if (!m[t.utterance_seq]) m[t.utterance_seq] = [];
      m[t.utterance_seq].push(t);
    });
    return m;
  }, [tags]);

  const commentMap = useMemo(() => {
    const m = {};
    comments.forEach((c) => {
      if (!m[c.utterance_seq]) m[c.utterance_seq] = [];
      m[c.utterance_seq].push(c);
    });
    return m;
  }, [comments]);

  const filteredData = useMemo(() => {
    let d = utterances;
    if (filterSpeaker) d = d.filter((i) => i.speaker === filterSpeaker);
    if (filterTag)
      d = d.filter((i) =>
        (tagMap[i.seq] || []).some((t) => t.tag === filterTag)
      );
    return d;
  }, [utterances, filterSpeaker, filterTag, tagMap]);

  // ── DB operations ──
  const handleSetHighlight = useCallback(
    async (seq, color) => {
      if (!reviewerName) return;
      if (color === null) {
        await supabase
          .from("highlights")
          .delete()
          .eq("session_id", session.id)
          .eq("utterance_seq", seq)
          .eq("reviewer_name", reviewerName);
        setHighlights((p) =>
          p.filter(
            (h) =>
              !(h.utterance_seq === seq && h.reviewer_name === reviewerName)
          )
        );
      } else {
        const { data, error } = await supabase
          .from("highlights")
          .upsert(
            {
              session_id: session.id,
              utterance_seq: seq,
              color,
              reviewer_name: reviewerName,
            },
            { onConflict: "session_id,utterance_seq,reviewer_name" }
          )
          .select()
          .single();
        if (!error && data) {
          setHighlights((p) => [
            ...p.filter(
              (h) =>
                !(h.utterance_seq === seq && h.reviewer_name === reviewerName)
            ),
            data,
          ]);
        }
      }
    },
    [session.id, reviewerName]
  );

  const handleToggleTag = useCallback(
    async (seq, tagId) => {
      if (!reviewerName) return;
      const existing = tags.find(
        (t) =>
          t.utterance_seq === seq &&
          t.tag === tagId &&
          t.reviewer_name === reviewerName
      );
      if (existing) {
        await supabase.from("tags").delete().eq("id", existing.id);
        setTags((p) => p.filter((t) => t.id !== existing.id));
      } else {
        const { data, error } = await supabase
          .from("tags")
          .insert({
            session_id: session.id,
            utterance_seq: seq,
            tag: tagId,
            reviewer_name: reviewerName,
          })
          .select()
          .single();
        if (!error && data) setTags((p) => [...p, data]);
      }
    },
    [session.id, reviewerName, tags]
  );

  const handleAddComment = useCallback(
    async (seq, text) => {
      if (!reviewerName) return;
      const { data, error } = await supabase
        .from("comments")
        .insert({
          session_id: session.id,
          utterance_seq: seq,
          text,
          reviewer_name: reviewerName,
        })
        .select()
        .single();
      if (!error && data) setComments((p) => [...p, data]);
    },
    [session.id, reviewerName]
  );

  const handleDeleteComment = useCallback(async (id) => {
    await supabase.from("comments").delete().eq("id", id);
    setComments((p) => p.filter((c) => c.id !== id));
  }, []);

  const handleSaveGlobalNote = useCallback(async () => {
    if (!reviewerName) return;
    await supabase.from("global_notes").upsert(
      {
        session_id: session.id,
        text: globalNote,
        reviewer_name: reviewerName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id,reviewer_name" }
    );
  }, [session.id, reviewerName, globalNote]);

  // Auto-save global note with debounce
  useEffect(() => {
    const t = setTimeout(handleSaveGlobalNote, 1000);
    return () => clearTimeout(t);
  }, [globalNote, handleSaveGlobalNote]);

  const totalComments = comments.length;
  const totalHighlights = highlights.length;
  const totalTagged = new Set(tags.map((t) => t.utterance_seq)).size;

  if (!reviewerName) return <NamePrompt onSubmit={setReviewerName} />;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-slate-600 transition-colors"
          >
            ← 목록
          </Link>
          <div>
            <h1 className="text-[15px] font-extrabold text-slate-900">
              {session.title}
            </h1>
            <span className="text-[11px] text-slate-400">
              {session.student} · {session.date} · {utterances.length}개 발화 ·
              리뷰어: <strong className="text-blue-600">{reviewerName}</strong>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-1 rounded-md hidden sm:inline">
            🖍 {totalHighlights} · 🏷 {totalTagged} · 💬 {totalComments}
          </span>
          <button
            onClick={() => setShowSummary(!showSummary)}
            className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors
              ${
                showSummary
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            📊 {showSummary ? "대화 보기" : "요약"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-slate-200 px-5 py-2 flex gap-1.5 items-center flex-wrap">
        <span className="text-[11px] text-slate-400 font-semibold">필터:</span>
        {[
          { k: null, l: "전체" },
          { k: "A", l: "🤖 AI" },
          { k: "B", l: "👤 학생" },
        ].map((o) => (
          <button
            key={String(o.k)}
            onClick={() => setFilterSpeaker(o.k)}
            className={`px-2 py-0.5 rounded-md text-[11px] transition-colors
              ${
                filterSpeaker === o.k
                  ? "border-[1.5px] border-blue-500 bg-blue-50 text-blue-700"
                  : "border border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
          >
            {o.l}
          </button>
        ))}
        <span className="text-slate-200">|</span>
        {TAG_OPTIONS.map((tag) => (
          <button
            key={tag.id}
            onClick={() =>
              setFilterTag(filterTag === tag.id ? null : tag.id)
            }
            className="px-1.5 py-0.5 rounded-md text-[10px] transition-colors"
            style={{
              border:
                filterTag === tag.id
                  ? `1.5px solid ${tag.color}`
                  : "1px solid #e2e8f0",
              background: filterTag === tag.id ? `${tag.color}12` : "#fff",
              color: filterTag === tag.id ? tag.color : "#94a3b8",
            }}
            title={tag.label}
          >
            {tag.icon}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-slate-400">
          {filteredData.length}개
        </span>
      </div>

      {showSummary ? (
        <div className="max-w-2xl mx-auto bg-white p-6 mt-0">
          <h3 className="text-base font-extrabold text-slate-900 mb-5">
            리뷰 요약
          </h3>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { l: "하이라이트", v: totalHighlights, c: "text-amber-500" },
              { l: "태그", v: totalTagged, c: "text-blue-500" },
              { l: "코멘트", v: totalComments, c: "text-red-500" },
            ].map((s, i) => (
              <div
                key={i}
                className="bg-slate-50 rounded-xl p-4 text-center"
              >
                <div className={`text-3xl font-black font-mono ${s.c}`}>
                  {s.v}
                </div>
                <div className="text-[12px] text-slate-400">{s.l}</div>
              </div>
            ))}
          </div>

          <h4 className="text-[13px] font-bold text-slate-600 mb-2">
            태그 분포
          </h4>
          {(() => {
            const tc = {};
            tags.forEach((t) => (tc[t.tag] = (tc[t.tag] || 0) + 1));
            const mx = Math.max(...Object.values(tc), 1);
            return TAG_OPTIONS.map((tag) => {
              const cnt = tc[tag.id] || 0;
              return (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 mb-1"
                >
                  <span className="text-[11px] w-20 text-slate-500 text-right">
                    {tag.icon} {tag.label}
                  </span>
                  <div className="flex-1 h-3.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full opacity-70 transition-all"
                      style={{
                        width:
                          cnt > 0
                            ? `${Math.max((cnt / mx) * 100, 8)}%`
                            : "0%",
                        background: tag.color,
                      }}
                    />
                  </div>
                  <span className="text-[11px] w-5 text-slate-400 font-mono">
                    {cnt}
                  </span>
                </div>
              );
            });
          })()}

          <h4 className="text-[13px] font-bold text-slate-600 mt-6 mb-2">
            전체 평가 메모 ({reviewerName})
          </h4>
          <textarea
            value={globalNote}
            onChange={(e) => setGlobalNote(e.target.value)}
            placeholder="이 튜터링 세션에 대한 전체적인 평가..."
            rows={8}
            className="w-full border border-slate-200 rounded-lg p-3 text-[13px] 
                       focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y leading-7"
          />

          {/* All notes */}
          {initialData.globalNotes.length > 0 && (
            <>
              <h4 className="text-[13px] font-bold text-slate-600 mt-6 mb-2">
                다른 리뷰어 메모
              </h4>
              {initialData.globalNotes
                .filter((n) => n.reviewer_name !== reviewerName)
                .map((n) => (
                  <div
                    key={n.id}
                    className="bg-slate-50 rounded-lg p-3 mb-2 text-[13px]"
                  >
                    <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {n.text}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      — {n.reviewer_name}
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-3">
          <div className="bg-white rounded-b-xl px-4 pb-4 shadow-sm">
            {filteredData.map((item) => (
              <UtteranceRow
                key={item.seq}
                item={item}
                highlight={highlightMap[item.seq]}
                itemTags={tagMap[item.seq] || []}
                itemComments={commentMap[item.seq] || []}
                isOpen={openId === item.seq}
                onOpen={setOpenId}
                onSetHighlight={handleSetHighlight}
                onToggleTag={handleToggleTag}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                reviewerName={reviewerName}
              />
            ))}
          </div>
          <div className="text-center py-5 text-[11px] text-slate-300">
            💡 발화를 클릭 → 형광펜 · 태그 · 코멘트 추가 | 모든 리뷰는 실시간
            저장되어 공유됩니다
          </div>
        </div>
      )}
    </div>
  );
}
