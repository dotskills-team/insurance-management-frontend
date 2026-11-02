"use client";

import { FileText, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { IClaim, IDocumentSubmission } from "@/types/claim.types";
import { formatDateTime } from "@/lib/utils/customer-portal-format";

interface ClaimDocumentHistoryProps {
  claim: IClaim;
}

interface DocumentGroup {
  key: string;
  submittedAt: string;
  submittedBy?: string;
  action: IDocumentSubmission["action"] | "LEGACY";
  documents: string[];
}

const getSubmitterName = (submittedBy: IDocumentSubmission["submittedBy"]) => {
  if (!submittedBy) return undefined;
  return typeof submittedBy === "object" ? submittedBy.name : undefined;
};

const isDocumentFile = (url: string) => /\.(pdf|docx?)($|\?)/i.test(url);

// Newest submission first. Claims created before document history existed
// only have the flat `attachments` list, which is shown as one legacy group.
const buildGroups = (claim: IClaim): DocumentGroup[] => {
  const submissions = claim.documentSubmissions ?? [];

  if (submissions.length > 0) {
    return [...submissions]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .map((s, idx) => ({
        key: `${s.submittedAt}-${idx}`,
        submittedAt: s.submittedAt,
        submittedBy: getSubmitterName(s.submittedBy),
        action: s.action,
        documents: s.documents,
      }));
  }

  if (claim.attachments && claim.attachments.length > 0) {
    return [
      {
        key: "legacy",
        submittedAt: claim.createdAt,
        action: "LEGACY",
        documents: claim.attachments,
      },
    ];
  }

  return [];
};

const ACTION_LABELS: Record<DocumentGroup["action"], string> = {
  CREATED: "Initial submission",
  UPDATED: "Added later",
  LEGACY: "Submitted",
};

export function ClaimDocumentHistory({ claim }: ClaimDocumentHistoryProps) {
  const groups = buildGroups(claim);
  const total = groups.reduce((sum, g) => sum + g.documents.length, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold tracking-widest uppercase text-slate-400 flex items-center gap-1">
          <History className="w-3 h-3" /> Document History
        </p>
        <span className="text-xs text-slate-400">
          {total} file{total === 1 ? "" : "s"}
        </span>
      </div>

      {groups.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No documents attached</p>
      ) : (
        groups.map((group) => (
          <div
            key={group.key}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/30 p-3 space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {formatDateTime(group.submittedAt)}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {ACTION_LABELS[group.action]}
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              {group.submittedBy ? `By ${group.submittedBy} · ` : ""}
              {group.documents.length} file{group.documents.length === 1 ? "" : "s"}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {group.documents.map((url, idx) => (
                <a
                  key={`${group.key}-${idx}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-16 h-16 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center bg-white dark:bg-slate-900 hover:opacity-80 transition-opacity"
                  title={`Document ${idx + 1}`}
                >
                  {isDocumentFile(url) ? (
                    <FileText className="h-6 w-6 text-indigo-500" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={`Document ${idx + 1}`} className="w-full h-full object-cover" />
                  )}
                </a>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
