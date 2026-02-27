import React from 'react';

interface AvatarIconProps {
    gan?: string; // 천간 (색상을 위함)
    zhi?: string; // 지지 (동물을 위함)
    size?: number; // 이미지 픽셀 크기
    className?: string;
}

// 지지와 동물 이미지(숫자) 매핑
const zhiToAnimalMap: Record<string, string> = {
    '자': 'rat', '축': 'ox', '인': 'tiger', '묘': 'rabbit',
    '진': 'dragon', '사': 'snake', '오': 'horse', '미': 'sheep',
    '신': 'monkey', '유': 'rooster', '술': 'dog', '해': 'pig'
};
const zhiToIndexMap: Record<string, string> = {
    '자': '0', '축': '1', '인': '2', '묘': '3',
    '진': '4', '사': '5', '오': '6', '미': '7',
    '신': '8', '유': '9', '술': 'a', '해': 'b'
};

// 천간에 따른 컬러(CSS 필터 혹은 배경색) 매퍼
const getFilterClass = (gan?: string) => {
    switch (gan) {
        case '갑': case '을': // 목 (파란/초록 계열)
            // 녹색 필터 근사치
            return 'hue-rotate-90 sepia-[.5] saturate-200 brightness-90';
        case '병': case '정': // 화 (붉은 계열)
            return 'hue-rotate-[320deg] sepia-[.3] saturate-[3] brightness-95';
        case '무': case '기': // 토 (노란/황금 계열)
            // 황금/노랑
            return 'sepia-[.8] saturate-[4] hue-rotate-[10deg] brightness-110';
        case '경': case '신': // 금 (하얀/회색 계열)
            // 흑백
            return 'grayscale brightness-105 contrast-125';
        case '임': case '계': // 수 (검정/파란 계열)
            // 어두운 파랑
            return 'hue-rotate-[200deg] sepia-[.5] saturate-150 brightness-75';
        default:
            return ''; // 알 수 없을 때 기본 컬러
    }
};

export default function AvatarIcon({ gan, zhi, size = 64, className = "" }: AvatarIconProps) {
    // 지지 데이터가 없으면 기본 회색 물음표 아바타나 기본 아이콘 처리
    if (!zhi || !zhiToIndexMap[zhi]) {
        return (
            <div
                className={`flex items-center justify-center bg-slate-100 rounded-full text-slate-300 ${className}`}
                style={{ width: size, height: size }}
            >
                ?
            </div>
        );
    }

    const animalName = zhiToAnimalMap[zhi];
    const indexChar = zhiToIndexMap[zhi];
    const imagePath = `/animals/${indexChar}_${animalName}.png`;
    const filterClass = getFilterClass(gan);

    return (
        <div
            className={`relative rounded-full overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center p-1 ${className}`}
            style={{ width: size, height: size }}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={imagePath}
                alt={`${gan || ''}${zhi} 아바타`}
                className={`w-full h-full object-contain mix-blend-multiply ${filterClass}`}
            />
        </div>
    );
}
