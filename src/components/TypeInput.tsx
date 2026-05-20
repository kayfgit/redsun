'use client';

import { useState, useEffect } from 'react';
import { COMMON_CHARACTERS } from '@/lib/constants';

interface TypeInputProps {
  onMatches: (matches: string[]) => void;
}

// Flat list of all characters for searching
const ALL_CHARACTERS = COMMON_CHARACTERS.flat();

export function TypeInput({ onMatches }: TypeInputProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!query.trim()) {
      onMatches([]);
      return;
    }

    // If the input is a Chinese character, find similar-looking ones
    // For now, show characters from the same group or nearby groups
    const isChinese = /[\u4e00-\u9fff]/.test(query);

    if (isChinese) {
      // Find which group the character belongs to
      const chars = query.split('');
      const lastChar = chars[chars.length - 1];
      const matches: string[] = [];

      for (const group of COMMON_CHARACTERS) {
        if (group.includes(lastChar)) {
          matches.push(...group.filter((c) => c !== lastChar));
        }
      }

      // If not found in any group, show first group as fallback
      if (matches.length === 0) {
        // Show the typed characters plus some common ones
        matches.push(...chars, ...ALL_CHARACTERS.slice(0, 12 - chars.length));
      }

      onMatches(matches.slice(0, 12));
    } else {
      // Pinyin-like input: show a sample set
      // In a full implementation, this would search a pinyin dictionary
      const index = query.length % COMMON_CHARACTERS.length;
      onMatches(COMMON_CHARACTERS[index]);
    }
  }, [query, onMatches]);

  return (
    <div className="flex w-full max-w-[400px] flex-col items-center justify-center aspect-square">
      <div className="w-full px-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type pinyin or character..."
          className="w-full border-b-2 border-ink/20 bg-transparent py-3 text-center font-serif-cn text-2xl text-ink placeholder:font-sans placeholder:text-base placeholder:text-ink-light/40 outline-none transition-colors focus:border-ink/50"
          autoFocus
        />
        <p className="mt-3 text-center font-sans text-xs text-ink-light/50">
          e.g. &quot;ni hao&quot; or &quot;你好&quot;
        </p>
      </div>
    </div>
  );
}
