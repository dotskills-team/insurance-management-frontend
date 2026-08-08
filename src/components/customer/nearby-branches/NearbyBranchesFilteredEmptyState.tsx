"use client";

import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NearbyBranchesFilteredEmptyStateProps {
  onClearFilters: () => void;
}

export function NearbyBranchesFilteredEmptyState({ onClearFilters }: NearbyBranchesFilteredEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 py-16 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-indigo-500/10 to-blue-500/5">
        <SearchX className="h-6 w-6 text-indigo-600/60 dark:text-indigo-400/60" />
      </div>
      <h3 className="text-base font-semibold text-foreground">No branches match your filters</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Try a different search term or category — nearby branches beyond the current results may still exist.
      </p>
      <Button
        variant="outline"
        onClick={onClearFilters}
        className="gap-2 transition-all duration-300 hover:shadow-md"
      >
        Clear Filters
      </Button>
    </div>
  );
}