'use client';

import { useParams, useRouter } from 'next/navigation';
import { PolicyData, PRIVACY_POLICY, REFUND_POLICY, TERMS_OF_SERVICE } from '@/constants/policies';
import MdShell from '@/components/naming/yunmyeong/MdShell';

// ─────────────────────────────────────────────
// 윤명 — 법적 고지 페이지 (개인정보처리방침 / 이용약관 / 환불정책)
// 약관 데이터는 재회 서비스와 동일한 policies.tsx를 공유하고,
// 화면만 윤명(hanji) 테마로 렌더링한다.
// 뒤로가기는 진입한 윤명 화면으로 복귀 (재회 랜딩으로 새지 않음)
// ─────────────────────────────────────────────

const POLICIES: Record<string, PolicyData> = {
    privacy: PRIVACY_POLICY,
    terms: TERMS_OF_SERVICE,
    refund: REFUND_POLICY,
};

export default function YunmyeongLegalPage() {
    const router = useRouter();
    const params = useParams<{ type: string }>();
    const policy = params?.type ? POLICIES[params.type] : undefined;

    /** 히스토리가 있으면 온 곳으로, 직접 진입이면 윤명 랜딩으로 */
    const goBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) router.back();
        else router.push('/yunmyeong');
    };

    if (!policy) {
        return (
            <MdShell theme="hanji">
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', textAlign: 'center' }}>
                    <p style={{ fontSize: 13.5, color: 'var(--md-text-2)' }}>존재하지 않는 문서입니다.</p>
                    <button className="md-btn md-btn--ghost" style={{ marginTop: 20, maxWidth: 220 }} onClick={() => router.push('/yunmyeong')}>
                        처음으로 돌아가기
                    </button>
                </div>
            </MdShell>
        );
    }

    return (
        <MdShell theme="hanji">
            {/* policies.tsx 본문에 쓰인 강조 클래스의 윤명 테마 스타일 (이 페이지에만 적용) */}
            <style jsx global>{`
                .md-legal .highlight-text { color: var(--md-accent); }
                .md-legal .highlight-sub { color: var(--md-text); }
                .md-legal .company-info-bg { background: var(--md-accent-soft); }
                .md-legal .company-info-border { border-color: var(--md-line-strong); }
            `}</style>
            <div className="md-screen md-legal">
                {/* 상단 바 */}
                <header style={{
                    position: 'sticky', top: 0, zIndex: 50,
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 20px', background: 'var(--md-bg-raise)',
                    borderBottom: '1px solid var(--md-line)',
                }}>
                    <button onClick={goBack} aria-label="뒤로 가기"
                        style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--md-line)', background: 'transparent', color: 'var(--md-text-2)', fontSize: 16, flexShrink: 0, cursor: 'pointer' }}>‹</button>
                    <strong className="md-serif" style={{ fontSize: 15.5, fontWeight: 700 }}>{policy.title}</strong>
                </header>

                {/* 본문 */}
                <main style={{ padding: '26px 22px 60px', display: 'grid', gap: 30, fontSize: 13, lineHeight: 1.75, color: 'var(--md-text-2)' }}>
                    {policy.sections.map((section, idx) => (
                        <section key={idx}>
                            {section.title ? (
                                <h2 className="md-serif" style={{ fontSize: 15, fontWeight: 700, color: 'var(--md-text)', marginBottom: 10 }}>
                                    {section.title}
                                </h2>
                            ) : null}
                            {typeof section.content === 'string' ? <p>{section.content}</p> : section.content}
                            {section.list ? (
                                <ul style={{ marginTop: 8, paddingLeft: 20, display: 'grid', gap: 4, listStyle: 'disc' }}>
                                    {section.list.map((item, i) => <li key={i}>{item}</li>)}
                                </ul>
                            ) : null}
                            {section.subSections?.map((sub, i) => (
                                <div key={i} style={{ marginTop: 8 }}>
                                    {sub.subtitle ? <span style={{ fontWeight: 700, color: 'var(--md-text)' }}>{sub.subtitle} </span> : null}
                                    {sub.content}
                                </div>
                            ))}
                            {section.footer}
                        </section>
                    ))}
                </main>
            </div>
        </MdShell>
    );
}
