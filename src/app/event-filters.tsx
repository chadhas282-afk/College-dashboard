'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CATEGORY_OPTIONS } from '@/types/database';

export default function EventFilters({
  initialQuery,
  initialCategory,
}: {
  initialQuery: string;
  initialCategory: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (q.trim()) params.set('q', q.trim());
      else params.delete('q');
      if (category) params.set('category', category);
      else params.delete('category');
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : '/', { scroll: false });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, category]);

  const active = Boolean(q || category);

  return (
    <div className="glass-strong rounded-2xl p-3 shadow-glass">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search events, topics, locations…"
            aria-label="Search events"
            className="field pl-10"
          />
        </div>

        <div
          className="nice-scroll -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:pb-0"
          role="group"
          aria-label="Filter by category"
        >
          <FilterChip active={!category} onClick={() => setCategory('')}>
            All
          </FilterChip>
          {CATEGORY_OPTIONS.map((c) => (
            <FilterChip
              key={c}
              active={category === c}
              onClick={() => setCategory(category === c ? '' : c)}
            >
              {c}
            </FilterChip>
          ))}
        </div>
      </div>

      {active && (
        <div className="mt-2.5 flex items-center gap-2 border-t border-white/10 pt-2.5">
          <span className="overline text-[10px]">filters active</span>
          <button
            type="button"
            onClick={() => {
              setQ('');
              setCategory('');
            }}
            className="text-xs font-medium text-cyan-300 transition hover:text-cyan-200"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition duration-200 ${
        active
          ? 'bg-cyan-400/90 text-void-950 shadow-neon-sm'
          : 'text-slate-300 hover:bg-white/[0.07] hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}