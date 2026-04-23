"use client";

import React, { useRef, useState, useEffect } from 'react';

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
}

export default function PhoneInput({ value, onChange }: PhoneInputProps) {
    const [part1, setPart1] = useState('');
    const [part2, setPart2] = useState('');
    const [part3, setPart3] = useState('');

    const input1Ref = useRef<HTMLInputElement>(null);
    const input2Ref = useRef<HTMLInputElement>(null);
    const input3Ref = useRef<HTMLInputElement>(null);

    // 외부 value 변경 동기화 (초기화 등)
    useEffect(() => {
        if (!value) {
            setPart1('');
            setPart2('');
            setPart3('');
        }
    }, [value]);

    const notifyChange = (p1: string, p2: string, p3: string) => {
        onChange(p1 + p2 + p3);
    };

    const handlePart1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        setPart1(val);
        notifyChange(val, part2, part3);
        if (val.length >= 3) {
            input2Ref.current?.focus();
        }
    };

    const handlePart2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        setPart2(val);
        notifyChange(part1, val, part3);
        if (val.length >= 4) {
            input3Ref.current?.focus();
        }
    };

    const handlePart3Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        setPart3(val);
        notifyChange(part1, part2, val);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, partIndex: number) => {
        if (e.key === 'Backspace') {
            if (partIndex === 2 && part2 === '') {
                input1Ref.current?.focus();
            } else if (partIndex === 3 && part3 === '') {
                input2Ref.current?.focus();
            }
        }
    };

    const inputClass = "w-full bg-[#1a2133] border border-white/10 text-white px-0 py-4 text-center rounded-xl focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-bold text-lg placeholder-slate-600";

    return (
        <div className="flex items-center gap-2 mb-6">
            <input
                ref={input1Ref}
                type="tel"
                value={part1}
                onChange={handlePart1Change}
                onKeyDown={(e) => handleKeyDown(e, 1)}
                maxLength={3}
                placeholder="010"
                className={inputClass}
            />
            <span className="text-slate-500 font-bold">-</span>
            <input
                ref={input2Ref}
                type="tel"
                value={part2}
                onChange={handlePart2Change}
                onKeyDown={(e) => handleKeyDown(e, 2)}
                maxLength={4}
                placeholder="0000"
                className={inputClass}
            />
            <span className="text-slate-500 font-bold">-</span>
            <input
                ref={input3Ref}
                type="tel"
                value={part3}
                onChange={handlePart3Change}
                onKeyDown={(e) => handleKeyDown(e, 3)}
                maxLength={4}
                placeholder="0000"
                className={inputClass}
            />
        </div>
    );
}
