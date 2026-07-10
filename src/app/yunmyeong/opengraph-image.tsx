import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '윤명 潤名 | 정통 수리 성명학 정밀 분석';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f5ede0',
                    position: 'relative',
                    fontFamily: 'serif',
                }}
            >
                {/* 배경 격자 패턴 (한지 느낌) */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage:
                            'repeating-linear-gradient(0deg, transparent, transparent 39px, #c9a96e22 39px, #c9a96e22 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, #c9a96e22 39px, #c9a96e22 40px)',
                        display: 'flex',
                    }}
                />

                {/* 상단 인장 라인 */}
                <div
                    style={{
                        position: 'absolute',
                        top: 48,
                        left: 0,
                        right: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 16,
                    }}
                >
                    <div style={{ height: 1, width: 80, background: '#c9a96e88', display: 'flex' }} />
                    <span style={{ fontSize: 13, color: '#c9a96e', letterSpacing: '0.2em' }}>
                        精統數理姓名學
                    </span>
                    <div style={{ height: 1, width: 80, background: '#c9a96e88', display: 'flex' }} />
                </div>

                {/* 중앙 메인 콘텐츠 */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0,
                        zIndex: 1,
                    }}
                >
                    {/* 한자 대제목 */}
                    <div
                        style={{
                            fontSize: 120,
                            fontWeight: 700,
                            color: '#1a140e',
                            letterSpacing: '0.15em',
                            lineHeight: 1,
                            display: 'flex',
                        }}
                    >
                        潤名
                    </div>

                    {/* 한글 브랜드명 */}
                    <div
                        style={{
                            fontSize: 36,
                            fontWeight: 400,
                            color: '#3d2e1e',
                            letterSpacing: '0.5em',
                            marginTop: 8,
                            display: 'flex',
                        }}
                    >
                        윤  명
                    </div>

                    {/* 구분선 */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            marginTop: 32,
                        }}
                    >
                        <div style={{ height: 1, width: 48, background: '#c9a96e', display: 'flex' }} />
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#c9a96e', display: 'flex' }} />
                        <div style={{ height: 1, width: 48, background: '#c9a96e', display: 'flex' }} />
                    </div>

                    {/* 태그라인 */}
                    <div
                        style={{
                            fontSize: 22,
                            fontWeight: 400,
                            color: '#5c4a35',
                            marginTop: 28,
                            letterSpacing: '0.05em',
                            display: 'flex',
                        }}
                    >
                        이름은 평생을 흐르는 가장 짧은 사주입니다
                    </div>
                </div>

                {/* 하단 서비스 설명 칩 3개 */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 72,
                        display: 'flex',
                        gap: 16,
                        alignItems: 'center',
                    }}
                >
                    {['작명 命名', '개명 改名', '감명 鑑名'].map((label) => (
                        <div
                            key={label}
                            style={{
                                padding: '8px 22px',
                                borderRadius: 999,
                                border: '1px solid #c9a96e',
                                fontSize: 16,
                                color: '#7a5c38',
                                background: '#fffdf9',
                                display: 'flex',
                                letterSpacing: '0.05em',
                            }}
                        >
                            {label}
                        </div>
                    ))}
                </div>

                {/* 하단 도메인 */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 36,
                        fontSize: 13,
                        color: '#c9a96e',
                        letterSpacing: '0.1em',
                        display: 'flex',
                    }}
                >
                    dasisaju.com/yunmyeong
                </div>
            </div>
        ),
        { ...size }
    );
}
