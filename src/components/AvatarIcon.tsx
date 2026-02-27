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

// 천간에 따른 컨테이너 배경/테두리 색상 매퍼
const getColorClasses = (gan?: string) => {
    switch (gan) {
        case '갑': case '을': // 목 (파란/초록 계열)
            return 'bg-emerald-100 border-emerald-300 text-emerald-800';
        case '병': case '정': // 화 (붉은 계열)
            return 'bg-rose-100 border-rose-300 text-rose-800';
        case '무': case '기': // 토 (노란/황금 계열)
            return 'bg-amber-100 border-amber-300 text-amber-800';
        case '경': case '신': // 금 (하얀/회색 계열)
            return 'bg-slate-200 border-slate-400 text-slate-800';
        case '임': case '계': // 수 (검정/물 계열 -> 맑은 파랑으로 대체)
            return 'bg-blue-100 border-blue-300 text-blue-800';
        default:
            return 'bg-slate-100 border-slate-200 text-slate-500'; // 알 수 없을 때 기본 컬러
    }
};

export default function AvatarIcon({ gan, zhi, size = 64, className = "" }: AvatarIconProps) {
    // 지지 데이터가 없으면 기본 회색 물음표 아바타 처리
    if (!zhi || !zhiToIndexMap[zhi]) {
        return (
            <div
                className={`flex items-center justify-center bg-slate-100 rounded-full text-slate-400 font-bold border-2 border-slate-200 ${className}`}
                style={{ width: size, height: size, fontSize: size * 0.4 }}
            >
                ?
            </div>
        );
    }

    const animalName = zhiToAnimalMap[zhi];
    const indexChar = zhiToIndexMap[zhi];
    const imagePath = `/animals/${indexChar}_${animalName}.png`;
    const colorClasses = getColorClasses(gan);

    return (
        <div
            className={`relative rounded-full overflow-hidden flex items-center justify-center border-2 border-white/50 shadow-sm transition-transform hover:scale-105 duration-200 ${colorClasses} ${className}`}
            style={{ width: size, height: size }}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={imagePath}
                alt={`${gan || ''}${zhi} 아바타`}
                // 해상도를 유지하면서 사각형 원본의 모서리만 둥근 컨테이너 바깥으로 잘려나가도록 약간만 확대 
                className="w-full h-full object-contain scale-[1.15] mix-blend-multiply grayscale contrast-110 opacity-90"
            />
        </div>
    );
}
