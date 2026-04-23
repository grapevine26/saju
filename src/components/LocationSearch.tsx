import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X } from 'lucide-react';

interface GeoLocation {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    timezone: string;
    country: string;
    admin1?: string; // 주/도
}

interface LocationSearchProps {
    value: string; // 현재 선택된 도시명 (표시용)
    disabled?: boolean;
    dataLocationInput?: string; // 자동 포커스용 data 속성
    onSelect: (cityName: string, timezone?: string, longitude?: number) => void;
}

export default function LocationSearch({ value, disabled = false, dataLocationInput, onSelect }: LocationSearchProps) {
    const [query, setQuery] = useState(value || '');
    const [results, setResults] = useState<GeoLocation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // 외부에서 value가 변경되면(예: 프로필 불러오기) query 업데이트
    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 디바운스된 검색 요청
    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(async () => {
            if (query.trim().length < 2) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                // Open-Meteo API 한국어 검색 최적화 보정 로직
                // (서울 등 한국어 약칭 검색 시 매칭률이 떨어지는 것을 보완하기 위해 내부적으로 영문 치환 후 한글 결과 요청)
                const korToEngMap: Record<string, string> = {
                    '서울': 'Seoul',
                    '부산': 'Busan',
                    '대구': 'Daegu',
                    '인천': 'Incheon',
                    '광주': 'Gwangju',
                    '대전': 'Daejeon',
                    '울산': 'Ulsan',
                    '제주': 'Jeju',
                    '제주도': 'Jeju',
                    '세종': 'Sejong',
                    '수원': '수원시',
                    '성남': '성남시',
                    '고양': '고양시',
                    '용인': '용인시',
                    '부천': '부천시',
                    '안산': '안산시',
                    '안양': '안양시',
                    '남양주': '남양주시',
                    '화성': '화성시',
                    '평택': '평택시',
                    '의정부': '의정부시',
                    '시흥': '시흥시',
                    '파주': '파주시',
                    '광명': '광명시',
                    '김포': '김포시',
                    '구리': '구리시',
                    '양주': '양주시',
                    '포천': '포천시',
                    '동두천': '동두천시',
                    '과천': '과천시',
                    '원주': '원주시',
                    '춘천': '춘천시',
                    '강릉': '강릉시',
                    '청주': '청주시',
                    '충주': '충주시',
                    '천안': '천안시',
                    '아산': '아산시',
                    '전주': '전주시',
                    '익산': '익산시',
                    '군산': '군산시',
                    '목포': '목포시',
                    '여수': '여수시',
                    '순천': '순천시',
                    '광양': '광양시',
                    '포항': '포항시',
                    '경주': '경주시',
                    '김천': '김천시',
                    '안동': '안동시',
                    '구미': '구미시',
                    '창원': '창원시',
                    '진주': '진주시',
                    '통영': '통영시',
                    '사천': '사천시',
                    '김해': '김해시',
                    '밀양': '밀양시',
                    '거제': '거제시',
                    '양산': '양산시',
                    '창녕': '창녕군'
                };
                const searchKeyword = korToEngMap[query.trim()] || query;

                // Open-Meteo Geocoding API (한글 지원)
                // 지역/도시(Administrative divisions, Populated places)만 나오도록 feature_code 필터 추가
                // P: Populated places, A: Administrative divisions
                const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchKeyword)}&count=10&language=ko&format=json`);
                const data = await res.json();

                // 서버에서 가져온 결과 중 지역/도시 관련 결과만 필터링
                // Open-Meteo API feature_code 중 PPL(도시/마을), ADM(행정구역) 형태만 일차 유지
                if (data.results) {
                    const filtered = data.results.filter((loc: any) => {
                        const isCityOrAdmin = loc.feature_code && (loc.feature_code.startsWith('PPL') || loc.feature_code.startsWith('ADM'));
                        if (!isCityOrAdmin) return false;

                        // 불필요한 해외의 작은 마을이나 동명이인(예: 아프리카의 서울) 제거를 위한 휴리스틱
                        const isMajorArea = ['PPLC', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4', 'ADM1', 'ADM2', 'ADM3'].includes(loc.feature_code);
                        const hasGoodPopulation = (loc.population || 0) >= 10000;

                        // 한국의 경우, API가 인구수를 반환하지 않는 PPL이 많음. 이름이 상위 행정구역에 포함되면(예: 과천 - 과천시) 진짜 지역으로 간주.
                        // 단, admin3(읍/면/동 단위)는 제외하여, 대전 검색 시 대정읍(대정)이 나오는 불상사를 방지함.
                        const isKoreanAdminRoot = loc.country_code === 'KR' && (
                            (loc.admin1 && loc.admin1.includes(loc.name)) ||
                            (loc.admin2 && loc.admin2.includes(loc.name))
                        );

                        // 외국 도시 중 인구 데이터가 없는 주요 도시 대응 (이름이 검색어와 완전히 일치하고, 상위 행정구역 이름과 같거나 주요 도시일 확률이 높은 경우)
                        const isSignificantForeignCity = loc.country_code !== 'KR' &&
                            (loc.name.toLowerCase() === query.trim().toLowerCase() || loc.name.toLowerCase() === searchKeyword.toLowerCase()) &&
                            (loc.admin1 && loc.admin1.includes(loc.name));

                        return isMajorArea || hasGoodPopulation || isKoreanAdminRoot || isSignificantForeignCity;
                    }).map((loc: any) => {
                        // Open-Meteo API가 천안을 "天安市", 세종을 "世宗" 등 한자/영문으로 뱉는 현상 보정
                        // 검색어(한글)와 영문 표기(searchKeyword) 중 매치되는 데이터면 강제로 한글 이름(query)으로 덮어씌움
                        if (loc.country_code === 'KR') {
                            const q = query.trim();
                            const eng = korToEngMap[q];
                            const hasHanja = /[\u4e00-\u9fa5]/.test(loc.name);
                            // 이름이 한자이거나 영문인데, 매핑 테이블의 영문과 일치하는 경우 강제 한글화
                            if (eng && (loc.name === eng || hasHanja)) {
                                // 세종이나 제주는 "세종시", "제주시"보다 "세종", "제주"로 많이 쓰이므로 '시'를 일괄 표기할지 결정
                                // API가 "천안시", "수원시" 처럼 시 단위로 부르는 애들은 시를 붙이고, 세종특별자치시는 보통 세종이라 부르므로 예외 처리
                                loc.name = (q === '세종' || q === '제주') ? q : `${q}시`;
                            } else if (!eng && (hasHanja || /[a-zA-Z]/.test(loc.name)) && loc.name.includes(searchKeyword)) {
                                loc.name = q;
                            }

                            // 불필요한 admin1/admin2의 한자/영어 번역 로직 추가 가능 (여기서는 주요 이름만)
                        }
                        return loc;
                    });

                    setResults(filtered);
                } else {
                    setResults([]);
                }
            } catch (error) {
                console.error("지역 검색 실패:", error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [query, isOpen]);

    const handleSelect = (loc: GeoLocation) => {
        let displayName = '';
        if (loc.admin1 && loc.admin1 !== loc.name && !loc.admin1.includes(loc.name) && !loc.name.includes(loc.admin1)) {
            displayName = `${loc.name}, ${loc.admin1} (${loc.country})`;
        } else {
            displayName = `${loc.name} (${loc.country})`;
        }
        setQuery(displayName);
        setIsOpen(false);
        onSelect(displayName, loc.timezone, loc.longitude);
    };

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setIsOpen(true);
        // 클리어 시에는 서울을 리셋값으로 쓰거나 빈 값 처리. 여기서는 호출부를 위해 빈 값 전달
        onSelect('', undefined, undefined);
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    disabled={disabled}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="태어난 도시 검색 (예: 서울, 뉴욕)"
                    data-location-input={dataLocationInput || undefined}
                    className="w-full p-4 pl-12 pr-12 rounded-xl bg-white border border-slate-200 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-slate-900 font-medium disabled:opacity-50 disabled:bg-slate-100 transition-colors"
                />
                {!disabled && query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors focus:outline-none"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* 자동완성 드롭다운 결과 목록 */}
            {isOpen && query && query.trim().length >= 2 && !disabled && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden max-h-64 overflow-y-auto animate-fade-in-up">
                    {isLoading ? (
                        <div className="p-4 flex items-center justify-center text-slate-500 text-sm">
                            <span className="w-4 h-4 border-2 border-slate-300 border-t-purple-500 rounded-full animate-spin mr-2"></span>
                            검색 중...
                        </div>
                    ) : results.length > 0 ? (
                        <ul>
                            {results.map((loc) => (
                                <li key={loc.id}>
                                    <button
                                        onClick={() => handleSelect(loc)}
                                        className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors flex items-start gap-3 border-b border-slate-50 last:border-0"
                                    >
                                        <MapPin className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                                        <div className="flex flex-col">
                                            <span className="text-slate-900 font-bold">{loc.name}</span>
                                            <span className="text-slate-500 text-xs mt-1">
                                                {loc.admin1 && `${loc.admin1}, `}{loc.country}
                                            </span>
                                            <span className="text-slate-400 text-[10px] uppercase tracking-wide mt-1 font-mono">
                                                TZ: {loc.timezone}
                                            </span>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-4 text-center text-slate-500 text-sm">
                            "{query}" 검색 결과가 없습니다.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
