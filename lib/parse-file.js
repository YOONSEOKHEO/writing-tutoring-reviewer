import * as XLSX from "xlsx";

/**
 * 파일명에서 날짜와 학생명을 추출
 * 예: "20260130 Oh.xls" → { date: "2026.01.30", student: "Oh" }
 */
export function extractMetaFromFilename(filename) {
  const name = filename.replace(/\.(xls|xlsx|csv)$/i, "");
  const match = name.match(/^(\d{8})\s+(.+)$/);
  if (!match) return { date: "", student: "" };

  const raw = match[1];
  const date = `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
  const student = match[2].trim();
  return { date, student };
}

/**
 * 세션 ID 생성
 * 예: ("2026.01.30", "Oh") → "20260130_Oh"
 */
export function generateSessionId(dateStr, student) {
  const datePart = dateStr.replace(/\./g, "");
  const studentPart = student.trim().replace(/\s+/g, "_");
  return `${datePart}_${studentPart}`;
}

/**
 * SheetJS로 XLS/XLSX/CSV 파일 파싱
 * @param {File} file
 * @returns {Promise<{ rows: Array, errors: string[] }>}
 */
export async function parseFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows: [], errors: ["시트를 찾을 수 없습니다."] };
  }

  const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  return validateRows(rawRows);
}

/**
 * 행 데이터 검증 및 seq 자동 부여
 */
export function validateRows(rawRows) {
  const errors = [];

  if (rawRows.length === 0) {
    return { rows: [], errors: ["데이터가 비어있습니다."] };
  }

  // 필수 열 확인
  const firstRow = rawRows[0];
  const requiredCols = ["speaker", "utterance", "start_time", "end_time"];
  for (const col of requiredCols) {
    if (!(col in firstRow)) {
      errors.push(`필수 열 "${col}"이(가) 없습니다.`);
    }
  }
  if (errors.length > 0) return { rows: [], errors };

  const rows = [];
  for (let i = 0; i < rawRows.length; i++) {
    const r = rawRows[i];
    const rowNum = i + 2; // 엑셀 행 번호 (헤더=1)

    const speaker = String(r.speaker || "").trim();
    if (speaker !== "A" && speaker !== "B") {
      errors.push(`행 ${rowNum}: speaker는 "A" 또는 "B"여야 합니다. (현재: "${speaker}")`);
    }

    const utterance = String(r.utterance || "").trim();
    if (!utterance) {
      errors.push(`행 ${rowNum}: utterance가 비어있습니다.`);
    }

    const startTime = Number(r.start_time);
    const endTime = Number(r.end_time);
    if (isNaN(startTime)) {
      errors.push(`행 ${rowNum}: start_time이 유효한 숫자가 아닙니다.`);
    }
    if (isNaN(endTime)) {
      errors.push(`행 ${rowNum}: end_time이 유효한 숫자가 아닙니다.`);
    }

    rows.push({
      seq: i,
      speaker,
      utterance,
      start_time: startTime,
      end_time: endTime,
    });
  }

  return { rows, errors };
}
