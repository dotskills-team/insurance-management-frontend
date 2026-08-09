
/* eslint-disable @typescript-eslint/no-explicit-any */

// export default CustomerConsultant;

"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import {
  Download,
  PhoneCall,
  PhoneIncoming,
  History,
  Video,
  Stethoscope,
  ShieldCheck,
  Loader2,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useZaynaxCall } from "@/hooks/useZaynaxCall";
import {
  IConsultation,
  useFetchPrescriptionMutation,
  useGetMyConsultationCountQuery,
  useGetMyConsultationsQuery,
} from "@/redux/features/consultant/consultant.api";

const outgoingCallAudio = "/assets/audio/outgoing-call-sound.mp3";
const incomingCallAudio = "/assets/audio/incoming-call-sound.mp3";


function formatDateTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(start?: string, end?: string) {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms <= 0) return "0m:0s";
  const totalSeconds = Math.floor(ms / 1000);
  return `${Math.floor(totalSeconds / 60)}m:${totalSeconds % 60}s`;
}

interface StatCardProps {
  icon: React.ElementType;
  value: React.ReactNode;
  label: string;
  gradient: string;
}

function StatCard({ icon: Icon, value, label, gradient }: StatCardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl sm:rounded-2xl bg-linear-to-br ${gradient} p-2.5 sm:p-5 shadow-sm ring-1 ring-white/10 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20 hover:ring-white/25`}
    >
      <div className="pointer-events-none absolute -right-5 sm:-right-8 -top-5 sm:-top-8 h-14 sm:h-24 w-14 sm:w-24 rounded-full bg-white/10 blur-2xl transition-transform duration-500 group-hover:scale-125" />
      <div className="relative flex flex-col items-center text-center gap-0.5 sm:gap-2">
        <div className="flex h-7 w-7 sm:h-11 sm:w-11 items-center justify-center rounded-lg sm:rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-110">
          <Icon className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-white" />
        </div>
        <p className="text-sm sm:text-2xl font-bold text-white tracking-tight tabular-nums">
          {value}
        </p>
        <p className="text-[9px] sm:text-xs font-medium text-white/75 truncate max-w-full leading-tight">
          {label}
        </p>
      </div>
    </div>
  );
}

function PrescriptionCell({ consultation }: { consultation: IConsultation }) {
  const [fetchPrescription, { isLoading }] = useFetchPrescriptionMutation();

  if (consultation.prescriptionStatus === "READY" && consultation.prescriptionUrl) {
    return (
      <Button size="sm" className="gap-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95">
        <a href={consultation.prescriptionUrl} target="_blank" rel="noopener noreferrer" className="flex gap-1 items-center">
          <Download className="w-3.5 h-3.5" /> Download Prescription
        </a>
      </Button>
    );
  }

  if (consultation.prescriptionStatus === "PENDING") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing prescription...
      </span>
    );
  }

  if (consultation.prescriptionStatus === "FAILED") {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={isLoading}
        onClick={() => fetchPrescription(consultation._id)}
        className="gap-1.5 rounded-full transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 active:scale-95"
      >
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Retry Sync
      </Button>
    );
  }

  return <span className="text-sm text-slate-400 dark:text-slate-600 italic">—</span>;
}

function CustomerConsultant() {
  const [page, setPage] = useState(1);
  const [jitsiReady, setJitsiReady] = useState(false);
  // NEW: controls the call modal's visibility. The modal itself (and the
  // #jitsi-call-container div inside it) is ALWAYS rendered in the tree —
  // only its CSS (hidden vs fixed-overlay) toggles. This preserves the
  // original fix where the container must never be unmounted.
  const [callModalOpen, setCallModalOpen] = useState(false);
  const limit = 10;

  const {
    data: listRes,
    isLoading,
    isFetching,
  } = useGetMyConsultationsQuery({ page, limit, sort: "-createdAt" });

  const { data: countRes } = useGetMyConsultationCountQuery();

  const {
    stage,
    doctorInfo,
    errorMessage,
    startCall,
    cancelCall,
    endCall,
    incomingCall,
    acceptIncomingCall,
    rejectIncomingCall,
  } = useZaynaxCall("jitsi-call-container");

  const consultations: IConsultation[] = Array.isArray(listRes?.data)
    ? listRes.data
    : Array.isArray((listRes?.data as any)?.data)
      ? (listRes?.data as any).data
      : [];

  const meta = Array.isArray(listRes?.data)
    ? listRes?.meta
    : (listRes?.data as any)?.meta;

  const totalTaken = countRes?.data.count ?? 0;

  const inCallStages: Array<typeof stage> = [
    "initiating",
    "ringing",
    "accepted",
    "in-call",
  ];
  const isCallActive = inCallStages.includes(stage);

  // ── Call sounds ──────────────────────────────────────────────
  const outgoingAudioRef = useRef<HTMLAudioElement | null>(null);
  const incomingAudioRef = useRef<HTMLAudioElement | null>(null);

  // Create the Audio instances once on mount.
  useEffect(() => {
    outgoingAudioRef.current = new Audio(outgoingCallAudio);
    outgoingAudioRef.current.loop = true;

    incomingAudioRef.current = new Audio(incomingCallAudio);
    incomingAudioRef.current.loop = true;

    return () => {
      outgoingAudioRef.current?.pause();
      incomingAudioRef.current?.pause();
      outgoingAudioRef.current = null;
      incomingAudioRef.current = null;
    };
  }, []);

  // Outgoing ring-tone: play while WE are calling and it's ringing.
  useEffect(() => {
    const audio = outgoingAudioRef.current;
    if (!audio) return;

    if (stage === "ringing") {
      audio.currentTime = 0;
      audio.play().catch(() => { });
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [stage]);

  // Incoming ring-tone: play while a doctor callback notification is
  // showing (and stop the moment it's accepted/declined/cleared, or a
  // call actually connects).
  useEffect(() => {
    const audio = incomingAudioRef.current;
    if (!audio) return;

    if (incomingCall && stage !== "in-call") {
      audio.currentTime = 0;
      audio.play().catch(() => { });
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [incomingCall, stage]);

  // Debug helper: warn early if the Jitsi container is missing when we
  // reach a stage that expects the iframe to be attached. This surfaces
  // the "appendChild on null" root cause instead of letting the raw
  // external_api.js exception crash silently.
  useEffect(() => {
    if (stage === "accepted" || stage === "in-call") {
      const el = document.getElementById("jitsi-call-container");
      if (!el) {
        console.warn(
          "[CustomerConsultant] #jitsi-call-container not found in DOM at stage:",
          stage
        );
      }
    }
  }, [stage]);

  // NEW: safety net — whenever a call becomes active (outgoing OR an
  // accepted incoming call), make sure the modal is open. This covers the
  // "doctor calls back" path in addition to the button-click path below.
  useEffect(() => {
    if (isCallActive) {
      setCallModalOpen(true);
    }
  }, [isCallActive]);

  useEffect(() => {
    if (incomingCall && stage !== "in-call") {
      setCallModalOpen(true);
    }
  }, [incomingCall, stage]);

  const handleStartCall = () => {
    startCall();
    setCallModalOpen(true);
  };

  const handleAcceptIncoming = () => {
    acceptIncomingCall();
    setCallModalOpen(true);
  };

  const handleCancelFromModal = () => {
    cancelCall();
    setCallModalOpen(false);
  };

  const handleEndFromModal = () => {
    endCall();
    setCallModalOpen(false);
  };

  const handleCloseModal = () => {
    // If a call is still ringing/connecting when the user hits the X,
    // treat it as a cancel so we don't leave a dangling socket/session.
    if (isCallActive && stage !== "in-call") {
      cancelCall();
    }
    setCallModalOpen(false);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* <BackToDashboardSection /> */}
      <Script
        // src="https://meet.zaynax.health/external_api.js"
        src="https://meet.zaynaxhealth.com/external_api.js"
        // src="https://meet.jit.si/external_api.js"
        strategy="lazyOnload"
        onLoad={() => setJitsiReady(true)}
      />

      {/* ── Hero card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-600 via-lime-600 to-blue-700 dark:from-indigo-700 dark:via-lime-800 dark:to-blue-900 p-8 sm:p-10 text-center shadow-lg shadow-indigo-900/10 dark:shadow-black/30">
        <div className="pointer-events-none absolute -top-14 -right-14 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-64 w-64 rounded-full bg-blue-300/10 blur-3xl" />

        <div className="relative flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20 shadow-sm">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Ready for Your Next
              <span className="block text-[#E8C97E]">Doctor Consultation?</span>
            </h2>
            <p className="max-w-2xl text-base sm:text-lg leading-8 text-slate-100">
              Connect instantly with experienced medical professionals and
              receive trusted healthcare advice from the comfort of your home
              through secure HD video consultation.
            </p>
          </div>

          {!isCallActive ? (
            <Button
              type="button"
              onClick={handleStartCall}
              disabled={!jitsiReady}
              size="lg"
              className="
group
relative
overflow-hidden
rounded-full
bg-[#64e13e]
hover:bg-[#44b322]
text-white hover:cursor-pointer

font-bold
text-base
px-10
py-7
shadow-xl
shadow-[#E8C97E]/30
transition-all
duration-300
ease-out
hover:scale-110
hover:-translate-y-1
hover:shadow-2xl
hover:shadow-[#E8C97E]/50
active:scale-95
"
            >
              {jitsiReady ? (
                <>
                  <span
                    className="
    absolute
    inset-0
    -translate-x-full
    bg-linear-to-r
    from-transparent
    via-white/40
    to-transparent
    transition-transform
    duration-700
    group-hover:translate-x-full
  "
                  />
                  <Video className="h-5 w-5 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6" />
                  <span className="transition-all duration-300 group-hover:tracking-wide">
                    Get Consultation Now
                  </span>
                </>
              ) : (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading call service...
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              size="lg"
              onClick={stage === "in-call" ? handleEndFromModal : handleCancelFromModal}
              className="gap-2 rounded-full px-7 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 ease-out"
            >
              {stage === "in-call" ? "End Call" : "Cancel"}
            </Button>
          )}

          {isCallActive && stage !== "in-call" && (
            <button
              type="button"
              onClick={() => setCallModalOpen(true)}
              className="flex items-center gap-2 text-sm text-indigo-50/90 underline-offset-2 hover:underline"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
              {stage === "initiating" && "Connecting to doctor service..."}
              {stage === "ringing" &&
                `Calling ${doctorInfo ? doctorInfo.firstName.en : "doctor"}...`}
              {stage === "accepted" && "Doctor accepted, joining call..."}
            </button>
          )}
        </div>
      </div>

      {stage === "error" && errorMessage && !callModalOpen && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </div>
      )}

      {stage === "rejected" && !incomingCall && !callModalOpen && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-700 dark:text-amber-400">
          The doctor couldn&apos;t take your call right now. They may call you
          back shortly — keep this page open.
        </div>
      )}

      {stage === "timeout" && !incomingCall && !callModalOpen && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-700 dark:text-amber-400">
          No response from the doctor. They may call you back shortly — keep
          this page open.
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard
          icon={PhoneCall}
          value={totalTaken}
          label="Calls Used"
          gradient="from-indigo-600 via-indigo-700 to-blue-900"
        />
        <StatCard
          icon={History}
          value={meta?.total ?? 0}
          label="Total Records"
          gradient="from-blue-600 via-blue-700 to-indigo-900"
        />
        <StatCard
          icon={ShieldCheck}
          value="24/7"
          label="Doctors Available"
          gradient="from-emerald-600 via-teal-700 to-blue-900"
        />
      </div>

      {/* ── Consultation history ── */}
      <Card className="overflow-hidden rounded-2xl shadow-sm p-0">
        <CardHeader className="border-b border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-950">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
            Completed Video Consultations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {isLoading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : consultations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Video className="h-10 w-10 text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                No completed consultations yet
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Start a consultation above to see it appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100 dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900">
                      <TableHead className="whitespace-nowrap">#SN</TableHead>
                      <TableHead className="whitespace-nowrap">
                        Call Start Time
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Call End Time
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Call Duration
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Prescription
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consultations?.map((c: IConsultation, index: number) => (
                      <TableRow
                        key={c._id}
                        className="transition-colors duration-150 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20"
                      >
                        <TableCell className="text-slate-500 dark:text-slate-400">
                          {(page - 1) * limit + index + 1}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {formatDateTime(c.callStartedAt)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {formatDateTime(c.callEndedAt)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-medium text-indigo-700 dark:text-indigo-400">
                          {formatDuration(c.callStartedAt, c.callEndedAt)}
                        </TableCell>
                        <TableCell>
                          <PrescriptionCell consultation={c} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {meta && meta.totalPage > 1 && (
                <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || isFetching}
                    onClick={() => setPage((p) => p - 1)}
                    className="transition-all duration-200 ease-out hover:shadow-sm hover:-translate-y-0.5 active:scale-95"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Page {meta.page} of {meta.totalPage}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= meta.totalPage || isFetching}
                    onClick={() => setPage((p) => p + 1)}
                    className="transition-all duration-200 ease-out hover:shadow-sm hover:-translate-y-0.5 active:scale-95"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/*
        ══════════════════════════════════════════════════════════════
        CALL MODAL — always rendered in the tree so #jitsi-call-container
        never unmounts (see the hook's comment about the appendChild-on-
        null crash). Only visibility/layout is toggled via className:
          - hidden               -> callModalOpen === false
          - centered dialog      -> callModalOpen && stage !== "in-call"
          - full-screen          -> callModalOpen && stage === "in-call"
        ══════════════════════════════════════════════════════════════
      */}
      <div
        className={
          callModalOpen
            ? "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
            : "hidden"
        }
      >
        <div
          className={
            stage === "in-call"
              ? "relative flex h-full w-full flex-col bg-slate-950"
              : "relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl"
          }
        >
          {/* Close (X) — only for non-in-call states; ending an active
              in-call session goes through the explicit "End Call" button
              instead, to avoid accidental hangups. */}
          {stage !== "in-call" && (
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {stage !== "in-call" && (
            <div className="flex flex-col items-center gap-4 p-8 pt-10 text-center">
              {doctorInfo && (
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {doctorInfo.firstName.en} {doctorInfo.lastName.en}
                </p>
              )}

              {incomingCall && (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                    <PhoneIncoming className="h-7 w-7 animate-pulse text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    Incoming call from {incomingCall.doctorName}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Your doctor is calling you back for your consultation.
                  </p>
                  <div className="flex gap-3 mt-1">
                    <Button
                      type="button"
                      onClick={handleAcceptIncoming}
                      className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6"
                    >
                      Accept
                    </Button>
                    <Button
                      type="button"
                      onClick={rejectIncomingCall}
                      variant="outline"
                      className="rounded-full px-6"
                    >
                      Decline
                    </Button>
                  </div>
                </>
              )}

              {stage === "initiating" && (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Connecting to doctor service...
                  </p>
                </>
              )}

              {stage === "ringing" && (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40">
                    <PhoneCall className="h-7 w-7 animate-pulse text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Calling {doctorInfo ? doctorInfo.firstName.en : "doctor"}...
                  </p>
                </>
              )}

              {stage === "accepted" && (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Doctor accepted, joining call...
                  </p>
                </>
              )}

              {stage === "error" && errorMessage && (
                <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
              )}

              {stage === "rejected" && (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  The doctor couldn&apos;t take your call right now. They may
                  call you back shortly — keep this page open.
                </p>
              )}

              {stage === "timeout" && (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  No response from the doctor. They may call you back shortly
                  — keep this page open.
                </p>
              )}

              {stage === "ended" && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Call ended.
                </p>
              )}

              {isCallActive && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleCancelFromModal}
                  className="mt-2 rounded-full px-6"
                >
                  Cancel
                </Button>
              )}
            </div>
          )}

          {/* Jitsi container — ALWAYS in the DOM, only its layout changes. */}
          <div
            className={
              stage === "in-call"
                ? "flex min-h-0 flex-1 flex-col"
                : "h-0 overflow-hidden"
            }
          >
            <div
              id="jitsi-call-container"
              className="w-full flex-1"
              style={{ minHeight: stage === "in-call" ? 0 : 1 }}
            />

            {stage === "in-call" && (
              <div className="flex items-center justify-center gap-2 bg-slate-950 py-2.5 text-xs font-medium tracking-wide text-slate-300">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>সুরক্ষা</span>
                <span className="text-slate-600">•</span>
                <span>Zaynax</span>
              </div>
            )}
          </div>

          {stage === "in-call" && (
            <button
              type="button"
              onClick={handleEndFromModal}
              className="absolute right-3 top-3 z-10 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-red-700"
            >
              End Call
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerConsultant;