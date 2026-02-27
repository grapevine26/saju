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
    onSelect: (cityName: string, timezone?: string, longitude?: number) => void;
}

export default function LocationSearch({ value, disabled = false, onSelect }: LocationSearchProps) {
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState<GeoLocation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // 외부에서 value가 변경되면(예: 프로필 불러오기) query 업데이트
    useEffect(() => {
        setQuery(value);
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
                    '세종': 'Sejong'
                };
                const searchKeyword = korToEngMap[query.trim()] || query;

                // Open-Meteo Geocoding API (한글 지원)
                const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchKeyword)}&count=10&language=ko&format=json`);
                const data = await res.json();

                if (data.results) {
                    setResults(data.results);
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
        const displayName = loc.admin1 ? `${loc.name}, ${loc.admin1} (${loc.country})` : `${loc.name} (${loc.country})`;
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
            {isOpen && query.trim().length >= 2 && !disabled && (
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
