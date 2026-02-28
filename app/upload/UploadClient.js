"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { parseFile, extractMetaFromFilename, generateSessionId } from "@/lib/parse-file";

export default function UploadClient() {
  const router = useRouter();
  const fileRef = useRef(null);

  // Step 1: 메타정보 + 파일 선택
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [student, setStudent] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);

  // Step 2: 미리보기 + 업로드
  const [rows, setRows] = useState([]);
  const [sessionId, setSessionId] = useState("");

  // 공통 상태
  const [errors, setErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setErrors([]);

    // 파일명에서 메타정보 자동 추출
    const meta = extractMetaFromFilename(f.name);
    if (meta.date && !date) setDate(meta.date);
    if (meta.student && !student) {
      setStudent(meta.student);
      if (!title) setTitle(`${meta.student} 튜터링`);
    }
  }

  async function handleNext() {
    // 유효성 검사
    const errs = [];
    if (!title.trim()) errs.push("제목을 입력해주세요.");
    if (!student.trim()) errs.push("학생 이름을 입력해주세요.");
    if (!date.trim()) errs.push("날짜를 입력해주세요.");
    if (!file) errs.push("파일을 선택해주세요.");
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }

    // 파일 파싱
    setErrors([]);
    setProgress("파일 파싱 중...");
    try {
      const result = await parseFile(file);
      if (result.errors.length > 0) {
        setErrors(result.errors);
        setProgress("");
        return;
      }
      setRows(result.rows);
      const id = generateSessionId(date, student);
      setSessionId(id);
      setStep(2);
      setProgress("");
    } catch (err) {
      setErrors([`파일 파싱 실패: ${err.message}`]);
      setProgress("");
    }
  }

  async function handleUpload() {
    setUploading(true);
    setErrors([]);

    try {
      // 세션 ID 중복 확인
      const { data: existing } = await supabase
        .from("sessions")
        .select("id")
        .eq("id", sessionId)
        .single();

      if (existing) {
        const ok = window.confirm(
          `세션 "${sessionId}"이(가) 이미 존재합니다. 덮어쓰시겠습니까?`
        );
        if (!ok) {
          setUploading(false);
          return;
        }
      }

      // 세션 삽입
      setProgress("세션 정보 저장 중...");
      const { error: sErr } = await supabase
        .from("sessions")
        .upsert(
          {
            id: sessionId,
            title: title.trim(),
            student: student.trim(),
            date: date.trim(),
            description: description.trim() || null,
          },
          { onConflict: "id" }
        );
      if (sErr) throw new Error(`세션 저장 실패: ${sErr.message}`);

      // 발화 데이터 배치 삽입
      const batchSize = 50;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize).map((r) => ({
          session_id: sessionId,
          seq: r.seq,
          speaker: r.speaker,
          utterance: r.utterance,
          start_time: r.start_time,
          end_time: r.end_time,
        }));

        setProgress(`발화 데이터 삽입 중... (${Math.min(i + batchSize, rows.length)}/${rows.length})`);

        const { error } = await supabase
          .from("utterances")
          .upsert(batch, { onConflict: "session_id,seq" });
        if (error) throw new Error(`발화 삽입 실패 (${i}번째 배치): ${error.message}`);
      }

      setProgress("완료! 세션 페이지로 이동 중...");
      router.push(`/session/${sessionId}`);
    } catch (err) {
      setErrors([err.message]);
      setUploading(false);
      setProgress("");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-3xl mx-auto px-5 py-12">
        {/* 헤더 */}
        <div className="mb-8">
          <a
            href="/"
            className="text-sm text-slate-400 hover:text-blue-600 transition-colors"
          >
            ← 목록으로 돌아가기
          </a>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-3">
            새 세션 업로드
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            XLS, XLSX, CSV 파일을 업로드하여 새 튜터링 세션을 생성합니다.
          </p>
        </div>

        {/* 스텝 표시 */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
              step === 1
                ? "bg-blue-600 text-white"
                : "bg-blue-100 text-blue-600"
            }`}
          >
            1
          </div>
          <div className="h-px w-8 bg-slate-300" />
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
              step === 2
                ? "bg-blue-600 text-white"
                : "bg-slate-200 text-slate-400"
            }`}
          >
            2
          </div>
        </div>

        {/* 에러 표시 */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-bold text-red-700 mb-1">오류</p>
            <ul className="text-sm text-red-600 space-y-1">
              {errors.map((e, i) => (
                <li key={i}>• {e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 진행 상태 */}
        {progress && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-700">{progress}</p>
          </div>
        )}

        {/* Step 1: 메타정보 입력 + 파일 선택 */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-5">
              세션 정보 입력
            </h2>

            <div className="space-y-4">
              {/* 파일 선택 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  파일 선택 *
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xls,.xlsx,.csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    cursor-pointer"
                />
                <p className="text-xs text-slate-400 mt-1">
                  .xls, .xlsx, .csv 형식 지원. 필수 열: speaker, utterance,
                  start_time, end_time
                </p>
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  제목 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 연구계획서 첨삭 튜터링"
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* 학생 이름 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  학생 이름 *
                </label>
                <input
                  type="text"
                  value={student}
                  onChange={(e) => setStudent(e.target.value)}
                  placeholder="예: Oh"
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* 날짜 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  날짜 * (YYYY.MM.DD)
                </label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="예: 2026.01.30"
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  설명 (선택)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="세션에 대한 간단한 설명"
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleNext}
              className="mt-6 w-full bg-blue-600 text-white rounded-lg py-3 text-sm font-bold hover:bg-blue-700 transition-colors"
            >
              다음 →
            </button>
          </div>
        )}

        {/* Step 2: 미리보기 + 업로드 확인 */}
        {step === 2 && (
          <div className="space-y-4">
            {/* 세션 정보 요약 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                세션 정보 확인
              </h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-slate-400">세션 ID</dt>
                  <dd className="font-mono font-bold text-slate-900">
                    {sessionId}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">제목</dt>
                  <dd className="font-bold text-slate-900">{title}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">학생</dt>
                  <dd className="text-slate-900">{student}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">날짜</dt>
                  <dd className="text-slate-900">{date}</dd>
                </div>
                {description && (
                  <div className="col-span-2">
                    <dt className="text-slate-400">설명</dt>
                    <dd className="text-slate-900">{description}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-slate-400">발화 수</dt>
                  <dd className="font-bold text-blue-600">{rows.length}개</dd>
                </div>
              </dl>
            </div>

            {/* 발화 미리보기 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                발화 데이터 미리보기
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 pr-3 text-slate-400 font-medium">
                        #
                      </th>
                      <th className="text-left py-2 pr-3 text-slate-400 font-medium">
                        화자
                      </th>
                      <th className="text-left py-2 pr-3 text-slate-400 font-medium">
                        발화
                      </th>
                      <th className="text-right py-2 text-slate-400 font-medium">
                        시작
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 10).map((r) => (
                      <tr
                        key={r.seq}
                        className="border-b border-slate-100"
                      >
                        <td className="py-2 pr-3 text-slate-400 tabular-nums">
                          {r.seq}
                        </td>
                        <td className="py-2 pr-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                              r.speaker === "A"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {r.speaker}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-slate-700 max-w-md truncate">
                          {r.utterance}
                        </td>
                        <td className="py-2 text-right text-slate-400 tabular-nums">
                          {formatMs(r.start_time)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 10 && (
                <p className="text-sm text-slate-400 mt-3 text-center">
                  ...외 {rows.length - 10}개 발화
                </p>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep(1);
                  setErrors([]);
                  setProgress("");
                }}
                disabled={uploading}
                className="flex-1 bg-white border border-slate-300 text-slate-700 rounded-lg py-3 text-sm font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                ← 이전
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 bg-blue-600 text-white rounded-lg py-3 text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {uploading ? "업로드 중..." : "업로드"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatMs(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}
