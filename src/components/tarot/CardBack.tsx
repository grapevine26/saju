"use client";

interface CardBackProps {
    isSelected?: boolean;
    isDisabled?: boolean;
    cardName?: string;
    size?: 'sm' | 'md' | 'deck';
    /** 화면 높이에 따라 카드 전체 크기를 배율로 키움 (기본 1) */
    scale?: number;
}

const SIZES = { sm: { w: 56, h: 80, r: 14 }, deck: { w: 76, h: 106, r: 18 }, md: { w: 80, h: 112, r: 20 } };

export default function CardBack({ isSelected, isDisabled, cardName, size = 'md', scale = 1 }: CardBackProps) {
    const base = SIZES[size];
    const w = base.w * scale;
    const h = base.h * scale;
    const r = base.r * scale;
    const cx = w / 2;
    const cy = h / 2;

    const borderColor = isSelected
        ? 'rgba(176,123,180,0.95)'
        : isDisabled
            ? 'rgba(176,123,180,0.15)'
            : 'rgba(176,123,180,0.42)';

    const bgGrad = isSelected
        ? `#3D2C6D`
        : isDisabled
            ? `#0D1026`
            : `#1B1F4A`;

    const accentColor      = isSelected ? '#B07BB4' : '#7B5BB8';
    const accentLightColor = isSelected ? '#F6D6E8' : '#B07BB4';
    const symbolOpacity    = isDisabled ? 0.18 : isSelected ? 1 : 0.6;

    const glow = isSelected
        ? 'drop-shadow(0 0 6px rgba(176,123,180,0.65)) drop-shadow(0 0 12px rgba(168,85,247,0.3))'
        : 'none';

    return (
        <svg
            width={w} height={h}
            viewBox={`0 0 ${w} ${h}`}
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block', filter: glow }}
        >
            <defs>
                <linearGradient id={`cg${size}${isSelected?'s':isDisabled?'d':'n'}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={isSelected ? '#3D2C6D' : '#1B1F4A'} />
                    <stop offset="100%" stopColor={isSelected ? '#2A1F54' : '#0D1026'} />
                </linearGradient>
            </defs>

            {/* 카드 본체 */}
            <rect x="1" y="1" width={w-2} height={h-2} rx="7" ry="7"
                fill={`url(#cg${size}${isSelected?'s':isDisabled?'d':'n'})`}
                stroke={borderColor} strokeWidth="1.2" />

            {/* 안쪽 테두리 */}
            <rect x="4" y="4" width={w-8} height={h-8} rx="5" ry="5"
                fill="none"
                stroke={isSelected ? 'rgba(176,123,180,0.35)' : 'rgba(176,123,180,0.12)'}
                strokeWidth="0.5" />

            {/* 중앙 만다라 패턴 */}
            <g opacity={symbolOpacity}>
                <circle cx={cx} cy={cy} r={r}      fill="none" stroke={accentColor} strokeWidth="0.7" />
                <circle cx={cx} cy={cy} r={r*0.55} fill="none" stroke={accentColor} strokeWidth="0.5" />

                {[0,45,90,135,180,225,270,315].map(deg=>{
                    const rad = (deg*Math.PI)/180;
                    const x1 = cx+Math.cos(rad)*(r*0.55);
                    const y1 = cy+Math.sin(rad)*(r*0.55);
                    const x2 = cx+Math.cos(rad)*r;
                    const y2 = cy+Math.sin(rad)*r;
                    return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accentColor} strokeWidth="0.5" />;
                })}

                {/* 중심 다이아몬드 */}
                <rect
                    x={cx-r*0.22} y={cy-r*0.22}
                    width={r*0.44} height={r*0.44} rx="1"
                    transform={`rotate(45 ${cx} ${cy})`}
                    fill={isSelected ? 'rgba(176,123,180,0.25)' : 'rgba(61,44,109,0.3)'}
                    stroke={accentLightColor} strokeWidth="0.6"
                />

                {/* 4귀퉁이 점 */}
                {[[-r*0.75,-r*0.75],[r*0.75,-r*0.75],[-r*0.75,r*0.75],[r*0.75,r*0.75]].map(([dx,dy],i)=>(
                    <circle key={i} cx={cx+dx} cy={cy+dy} r="1" fill={accentLightColor} opacity="0.55" />
                ))}

                {/* 중앙 별 */}
                <text x={cx} y={cy+4*scale} textAnchor="middle"
                    fontSize={(size==='sm' ? 8 : 10) * scale}
                    fill="rgba(212,168,83,0.75)" fontFamily="serif">★</text>
            </g>

            {/* 선택 시 선택 표시 하단 바 */}
            {isSelected && cardName && size === 'md' && (
                <>
                    <rect x="4" y={h-22*scale} width={w-8} height={18*scale} rx="3"
                        fill="rgba(176,123,180,0.2)" />
                    <text x={cx} y={h-11*scale} textAnchor="middle"
                        fontSize={7.5*scale} fontWeight="600" fill="#F6D6E8"
                        fontFamily="system-ui, sans-serif">{cardName}</text>
                </>
            )}

            {/* 선택 글로우 오버레이 */}
            {isSelected && (
                <rect x="1" y="1" width={w-2} height={h-2} rx="7" ry="7"
                    fill="rgba(176,123,180,0.06)" />
            )}
        </svg>
    );
}
