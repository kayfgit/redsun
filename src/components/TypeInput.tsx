'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getCandidates, resolveInput, resolvePhrase, splitPinyin } from '@/lib/pinyinUtils';
import { CHAR_INFO } from '@/lib/pinyinData';
import { useLanguage } from './LanguageProvider';

interface PhraseEntry {
  char: string;
  pinyin: string;
  meaning: string;
}

interface TypeInputProps {
  onMatches: (matches: string[]) => void;
  onConfirm: (entries: PhraseEntry[]) => void;
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
}

export function TypeInput({ onMatches, onConfirm, selectedIndex, onSelectedIndexChange }: TypeInputProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const matchesRef = useRef<string[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      onMatches([]);
      matchesRef.current = [];
      onSelectedIndexChange(0);
      return;
    }

    const isChinese = /[\u4e00-\u9fff]/.test(query);

    let candidates: string[];
    if (isChinese) {
      const chars = query.match(/[\u4e00-\u9fff]/g) || [];
      candidates = chars.slice(0, 12);
    } else {
      candidates = getCandidates(query).slice(0, 12);
    }

    matchesRef.current = candidates;
    onMatches(candidates);
    onSelectedIndexChange(0);
  }, [query, onMatches, onSelectedIndexChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const matches = matchesRef.current;

      if (e.key === 'Tab') {
        e.preventDefault();
        if (matches.length === 0) return;

        if (e.shiftKey) {
          // Shift+Tab: go backward
          onSelectedIndexChange(selectedIndex <= 0 ? matches.length - 1 : selectedIndex - 1);
        } else {
          // Tab: go forward
          onSelectedIndexChange(selectedIndex >= matches.length - 1 ? 0 : selectedIndex + 1);
        }
        return;
      }

      if (e.key !== 'Enter' || !query.trim()) return;

      const selected = matches[selectedIndex] || matches[0];
      if (!selected) return;

      const isChinese = /[\u4e00-\u9fff]/.test(query);
      const isMultiChar = selected.length > 1;

      if (isChinese || isMultiChar) {
        // Resolve the selected phrase/character
        const entries = resolvePhrase(selected);
        if (entries.length > 0) {
          onConfirm(entries);
          setQuery('');
        }
      } else {
        // Single pinyin syllable → confirm the selected character
        const info = CHAR_INFO[selected];
        onConfirm([{
          char: selected,
          pinyin: info?.pinyin || '?',
          meaning: info?.meaning || '?',
        }]);
        setQuery('');
      }
    },
    [query, onConfirm, selectedIndex, onSelectedIndexChange]
  );

  // Determine if we're in phrase mode (multi-syllable input)
  const trimmed = query.toLowerCase().trim();
  const isPhrase = !(/[\u4e00-\u9fff]/.test(trimmed)) && trimmed.length > 0 && splitPinyin(trimmed) !== null && (splitPinyin(trimmed)?.length ?? 0) > 1;

  return (
    <div
      className="flex w-full max-w-[600px] flex-col items-center justify-center aspect-square rounded-sm"
      style={{
        backgroundColor: '#F8F3EB',
        boxShadow: 'inset 0 0 50px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid rgba(26, 26, 26, 0.08)',
      }}
    >
      <div className="w-full px-12">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('type.placeholder')}
          className="w-full border-b-2 border-ink/20 bg-transparent py-3 text-center font-serif-cn text-2xl text-ink placeholder:font-sans placeholder:text-base placeholder:text-ink-light/40 outline-none transition-colors focus:border-ink/50"
          autoFocus
        />
        <p className="mt-3 text-center font-sans text-xs text-ink-light/50">
          {isPhrase ? t('type.phraseHint') : t('type.charHint')}
        </p>
      </div>
    </div>
  );
}
