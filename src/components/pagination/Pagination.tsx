
"use client";

import { Button } from "@/components/ui/button";

type PaginationProps = {
  page: number;
  totalPage: number;
  onPageChange: (page: number) => void;
  siblings?: number; 
};

const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i);

const getPageNumbers = (
  page: number,
  totalPage: number,
  siblings = 1,
): (number | "...")[] => {
  const totalNumbers = siblings * 2 + 5;

  if (totalPage <= totalNumbers) return range(1, totalPage);

  const left = Math.max(page - siblings, 1);
  const right = Math.min(page + siblings, totalPage);

  const showLeftDots = left > 2;
  const showRightDots = right < totalPage - 1;

  if (!showLeftDots && showRightDots) {
    return [...range(1, 3 + siblings * 2), "...", totalPage];
  }

  if (showLeftDots && !showRightDots) {
    return [1, "...", ...range(totalPage - (2 + siblings * 2), totalPage)];
  }

  return [1, "...", ...range(left, right), "...", totalPage];
};

export function Pagination({
  page,
  totalPage,
  onPageChange,
  siblings = 1,
}: PaginationProps) {
  if (totalPage <= 1) return null;

  const handlePrev = () => {
    if (page > 1) onPageChange(page - 1);
  };

  const handleNext = () => {
    if (page < totalPage) onPageChange(page + 1);
  };

  const pages = getPageNumbers(page, totalPage, siblings);

  return (
    <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
      {/* Info */}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Page{" "}
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {page}
        </span>{" "}
        of {totalPage}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={page === 1}
        >
          Previous
        </Button>

        <div className="flex items-center gap-1">
          {pages.map((p, i) => {
            if (p === "...") {
              return (
                <span
                  key={`dots-${i}`}
                  className="w-9 text-center text-slate-400 select-none"
                >
                  …
                </span>
              );
            }

            const isActive = p === page;

            return (
              <Button
                key={p}
                size="sm"
                variant={isActive ? "default" : "outline"}
                onClick={() => onPageChange(p)}
                aria-current={isActive ? "page" : undefined}
                className={`min-w-9 px-2 ${
                  isActive
                    ? "border-indigo-600 text-white bg-indigo-700 hover:bg-indigo-800 hover:text-white hover:shadow-xl hover:scale-105 duration-500 ease-in-out cursor-pointer font-bold tracking-widest transition-colors"
                    : ""
                }`}
              >
                {p}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={page === totalPage}
        >
          Next
        </Button>
      </div>
    </div>
  );
}