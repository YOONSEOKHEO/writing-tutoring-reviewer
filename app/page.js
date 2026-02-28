import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const revalidate = 60; // ISR: 60초마다 재검증

async function getSessions() {
  const { data, error } = await supabase
    .from("sessions")
    .select("*, utterances(count)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
  return data || [];
}

export default async function HomePage() {
  const sessions = await getSessions();

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-3xl mx-auto px-5 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-700 to-violet-600 flex items-center justify-center text-2xl text-white">
              📖
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Writing Tutoring Reviewer
              </h1>
              <p className="text-sm text-slate-500">
                글쓰기 튜터링 대화를 분석하고 코멘트를 공유하세요
              </p>
            </div>
          </div>
        </div>

        {/* Session list */}
        <h2 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">
          튜터링 세션 목록
        </h2>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400">
            아직 등록된 세션이 없습니다.
            <br />
            <code className="text-xs mt-2 inline-block bg-slate-100 px-2 py-1 rounded">
              npm run seed
            </code>
            를 실행하여 데이터를 추가하세요.
          </div>
        ) : (
          sessions.map((s) => (
            <Link
              key={s.id}
              href={`/session/${s.id}`}
              className="block bg-white rounded-2xl p-6 mb-3 border border-slate-200 
                         hover:border-blue-300 hover:shadow-lg hover:shadow-blue-50
                         transition-all duration-200 group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-sm text-slate-500 mb-3 leading-relaxed">
                    {s.description}
                  </p>
                  <div className="flex gap-4 text-xs text-slate-400">
                    <span>👤 {s.student}</span>
                    <span>📅 {s.date}</span>
                    <span>
                      💬 {s.utterances?.[0]?.count || "?"} 개 발화
                    </span>
                  </div>
                </div>
                <span className="text-2xl text-slate-300 group-hover:text-blue-400 transition-colors">
                  →
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
