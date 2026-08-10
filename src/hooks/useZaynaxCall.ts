/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import {
  ConsultationStatus,
  useGetActiveConsultationQuery,
  useInitiateConsultationMutation,
  useUpdateConsultationStatusMutation,
} from "@/redux/features/consultant/consultant.api";
import { useCallback, useEffect, useRef, useState } from "react";
import io from "socket.io-client";

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

type CallStage =
  | "idle"
  | "initiating"
  | "ringing"
  | "accepted"
  | "rejected"
  | "timeout"
  | "in-call"
  | "ended"
  | "error";

interface DoctorInfo {
  firstName: { en: string; bn: string };
  lastName: { en: string; bn: string };
  image: string;
}

interface IncomingCall {
  doctorID: string;
  doctorName: string;
  docImage: string;
  roomID: string;
  orderID: string;
}

const ZAYNAX_SOCKET_URL = process.env.NEXT_PUBLIC_ZAYNAX_SOCKET_URL || "https://api.zaynaxhealth.com";
const RING_TIMEOUT_MS = 30_000;
// How long we'll keep polling for the Jitsi container div to appear in the
// DOM before giving up. This covers the gap between setStageBoth("accepted")
// (which triggers the container to render) and the actual DOM commit.
const CONTAINER_WAIT_TIMEOUT_MS = 5_000;

const DEBUG = true;
const log = (...args: any[]) => {
  if (DEBUG) console.log("[ZaynaxCall]", ...args);
};

export function useZaynaxCall(jitsiContainerId: string) {
  const [stage, setStage] = useState<CallStage>("idle");
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  // Set instead of calling joinJitsi() directly from inside socket event
  // handlers. A useEffect watches this and only creates the Jitsi iframe
  // once the container div has actually committed to the DOM — this is
  // what fixes the "Cannot read properties of null (reading 'appendChild')"
  // crash, which happened because the container didn't exist yet at the
  // exact moment the old synchronous joinJitsi() call ran.
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);

  const [initiateConsultation] = useInitiateConsultationMutation();
  const [updateStatus] = useUpdateConsultationStatusMutation();

  // Checked once on mount — tells us whether there's an existing booking
  // (from an earlier attempt, not yet terminal) that a doctor could still
  // call back on.
  const { data: activeRes } = useGetActiveConsultationQuery();

  // const socketRef = useRef<SocketIOClient.Socket | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const stageRef = useRef<CallStage>("idle");
  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef<{ consultationId: string; roomId: string; orderID: string } | null>(null);
  const jitsiApiRef = useRef<any>(null);

  console.log("active consultant res ", activeRes)

  const setStageBoth = useCallback((s: CallStage) => {
    log("stage:", stageRef.current, "->", s);
    stageRef.current = s;
    setStage(s);
  }, []);

  const reportStatus = useCallback(
    (
      status: ConsultationStatus,
      extra?: { callStartedAt?: string; callEndedAt?: string; prescriptionUrl?: string },
    ) => {
      const s = sessionRef.current;
      if (!s) {
        log("reportStatus skipped (no active session):", status);
        return;
      }
      log("reportStatus:", status, extra ?? "");
      updateStatus({ id: s.consultationId, status, ...extra }).catch((err) => {
        log("reportStatus FAILED:", status, err);
      });
    },
    [updateStatus],
  );

  const clearRingTimeout = useCallback(() => {
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
  }, []);

  const cleanupSocket = useCallback((reason: string) => {
    log("cleanupSocket:", reason);
    clearRingTimeout();
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, [clearRingTimeout]);

  // Renamed the old "joinJitsi" trigger to requestJoinJitsi: it no longer
  // touches the DOM itself. It just records which room we want to join;
  // the actual iframe creation happens in the effect below, once React
  // has committed the container div to the DOM.
  const requestJoinJitsi = useCallback((roomId: string) => {
    log("requestJoinJitsi (queued):", roomId);
    setPendingRoomId(roomId);
  }, []);

  // Actual Jitsi iframe creation. Only ever called from the effect once
  // the container element is confirmed to exist.
  const createJitsiInstance = useCallback(
    (roomId: string, containerEl: HTMLElement) => {
      if (!window.JitsiMeetExternalAPI) {
        setErrorMessage("Video call could not load, please refresh and try again.");
        setStageBoth("error");
        return;
      }

      const api = new window.JitsiMeetExternalAPI("meet.zaynaxhealth.com", {
        // const api = new window.JitsiMeetExternalAPI("meet.zaynax.health", {
        roomName: roomId,
        parentNode: containerEl,
        width: "100%",
        height: "100%",
      });
      jitsiApiRef.current = api;
      setStageBoth("in-call");

      const handleCallEnded = () => {
        log("Jitsi reported call ended (videoConferenceLeft/readyToClose)");
        reportStatus(ConsultationStatus.COMPLETED, {
          callEndedAt: new Date().toISOString(),
        });
        cleanupSocket("jitsi call ended");
        setStageBoth("ended");
        api.dispose();
        jitsiApiRef.current = null;
      };

      api.addEventListener("videoConferenceLeft", handleCallEnded);
      api.addEventListener("readyToClose", handleCallEnded);
    },
    [setStageBoth, reportStatus, cleanupSocket],
  );

  // Waits (polls via rAF) for the container element to exist in the DOM,
  // then creates the Jitsi instance. Bails out with an error after
  // CONTAINER_WAIT_TIMEOUT_MS if the container never shows up — this
  // usually means the container's parent conditional (`isCallActive`)
  // isn't including the current stage, i.e. a real bug elsewhere rather
  // than just a timing gap.
  useEffect(() => {
    if (!pendingRoomId) return;

    let cancelled = false;
    const startedAt = Date.now();

    const tryFind = () => {
      if (cancelled) return;

      const el = document.getElementById(jitsiContainerId);
      if (el) {
        setPendingRoomId(null);
        createJitsiInstance(pendingRoomId, el);
        return;
      }

      if (Date.now() - startedAt > CONTAINER_WAIT_TIMEOUT_MS) {
        log("❌ timed out waiting for #" + jitsiContainerId + " to appear in the DOM");
        setPendingRoomId(null);
        setErrorMessage("Video call area didn't load in time, please try again.");
        setStageBoth("error");
        return;
      }

      requestAnimationFrame(tryFind);
    };

    tryFind();

    return () => {
      cancelled = true;
    };
  }, [pendingRoomId, jitsiContainerId, createJitsiInstance, setStageBoth]);

  // Shared listener wiring for BOTH kinds of socket connection below
  // (outgoing call, and listen-only reconnect). roomId/orderID are closed
  // over so DOCTOR_CALL_ACCEPTED/REJECTED join/report against the right call.
  const registerListeners = useCallback(
    // (socket: SocketIOClient.Socket, roomId: string, orderID: string) => {
    (socket: ReturnType<typeof io>,
      roomId: string,
      orderID: string) => {
      socket.on("disconnect", (reason: any) => log("❌ socket disconnected. reason:", reason));
      socket.on("reconnect", (attempt: any) => log("🔄 socket reconnected after", attempt, "attempt(s)"));
      socket.on("reconnect_attempt", (attempt: any) => log("🔁 reconnect_attempt #", attempt));
      socket.on("error", (err: any) => log("⚠️ socket error event:", err));

      socket.on("INCOMING_CALL_FROM_DOCTOR", (payload: any) => {
        // Zaynax wraps this in a `data` key — unwrap so incomingCall in
        // state is always the flat shape everywhere downstream.
        const incoming: IncomingCall = payload?.data ?? payload;
        log("📞 INCOMING_CALL_FROM_DOCTOR unwrapped:", incoming);
        setIncomingCall(incoming);
      });

      socket.on("INCOMING_CALL_CANCELLED", () => {
        log("INCOMING_CALL_CANCELLED received");
        setIncomingCall(null);
      });

      socket.on("DOCTOR_CALL_ACCEPTED", () => {
        log("DOCTOR_CALL_ACCEPTED received");
        clearRingTimeout();
        setStageBoth("accepted");
        reportStatus(ConsultationStatus.ACCEPTED, { callStartedAt: new Date().toISOString() });
        requestJoinJitsi(roomId);
      });

      socket.on("DOCTOR_CALL_REJECTED", () => {
        log("DOCTOR_CALL_REJECTED received");
        clearRingTimeout();
        setStageBoth("rejected");
        reportStatus(ConsultationStatus.REJECTED);
      });

      socket.on("DOCTOR_OFFLINE", () => {
        log("DOCTOR_OFFLINE received");
        clearRingTimeout();
        setStageBoth("rejected");
        reportStatus(ConsultationStatus.FAILED);
      });
    },
    [clearRingTimeout, requestJoinJitsi, reportStatus, setStageBoth],
  );

  /**
   * LISTEN-ONLY socket connection for an already-existing booking.
   * Does NOT emit PATIENT_OUTGOING_CALL and does NOT create any new
   * consultation — it just opens the socket so INCOMING_CALL_FROM_DOCTOR
   * can reach us if the doctor calls back on a booking from an earlier
   * attempt. Called automatically on mount (see the effect below); safe
   * to call again manually since it no-ops if a socket is already open.
   */
  const connectListenerSocket = useCallback(
    (data: { consultationId: string; roomId: string; orderID?: string; zaynaxAuthToken: string }) => {
      if (sessionRef.current || socketRef.current) {
        log("connectListenerSocket skipped — a session/socket already exists");
        return;
      }

      const { consultationId, roomId, orderID, zaynaxAuthToken } = data;
      log("connectListenerSocket: opening listen-only socket for", { consultationId, roomId });

      sessionRef.current = { consultationId, roomId, orderID: orderID ?? "" };

      const socket = io(ZAYNAX_SOCKET_URL, {
        query: { auth: zaynaxAuthToken },
        transports: ["websocket"],
      });
      socketRef.current = socket;
      registerListeners(socket, roomId, orderID ?? "");

      socket.on("connect", () => {
        log("✅ (listener) socket connected. id:", socket.id);
      });

      socket.on("connect_error", (err: any) => {
        log("(listener) connect_error:", err.message);
      });
    },
    [registerListeners],
  );



  useEffect(() => {
    const handlePageHide = () => {
      const s = sessionRef.current;
      if (!s || stageRef.current !== "in-call") return;

      const payload = JSON.stringify({
        id: s.consultationId,
        status: ConsultationStatus.COMPLETED,
        callEndedAt: new Date().toISOString(),
      });

      navigator.sendBeacon?.(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/consultations/beacon-status`,
        new Blob([payload], { type: "application/json" }),
      );
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, []);

  // Runs once an active-consultation check comes back — if there's
  // something to listen for, connect. No-ops otherwise.
  useEffect(() => {
    if (!activeRes?.data) {
      log("no active consultation to listen for");
      return;
    }
    connectListenerSocket(activeRes.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRes]);

  /**
   * Button-triggered: creates a brand-new consultation/booking via
   * initiateConsultation, then opens an OUTGOING socket connection
   * (emits PATIENT_OUTGOING_CALL). Distinct from connectListenerSocket,
   * which never creates a booking.
   */
  const startCall = useCallback(async () => {
    setStageBoth("initiating");
    setErrorMessage(null);

    try {
      const res = await initiateConsultation().unwrap();
      const { consultationId, roomId, orderID, doctorInfo: doctor, zaynaxAuthToken } = res.data;

      log("initiateConsultation ok:", { consultationId, roomId, orderID });

      // Tear down any listen-only socket from connectListenerSocket first,
      // so we don't end up with two connections for two different bookings.
      cleanupSocket("starting a fresh outgoing call");

      sessionRef.current = { consultationId, roomId, orderID };
      setDoctorInfo(doctor);

      const socket = io(ZAYNAX_SOCKET_URL, {
        query: { auth: zaynaxAuthToken },
        transports: ["websocket"],
      });
      socketRef.current = socket;
      registerListeners(socket, roomId, orderID);

      socket.on("connect", () => {
        log("✅ socket connected. id:", socket.id);
        socket.emit("PATIENT_OUTGOING_CALL", { orderID, roomID: roomId });
        log("emitted PATIENT_OUTGOING_CALL:", { orderID, roomID: roomId });
        setStageBoth("ringing");
        reportStatus(ConsultationStatus.RINGING);

        ringTimeoutRef.current = setTimeout(() => {
          if (stageRef.current === "ringing") {
            log("⏱ ring timeout — staying connected for a possible doctor callback");
            setStageBoth("timeout");
            reportStatus(ConsultationStatus.TIMEOUT);
            // Deliberately not cancelling on Zaynax's side or disconnecting.
          }
        }, RING_TIMEOUT_MS);
      });

      socket.on("connect_error", (err: any) => {
        log("connect_error:", err.message);
        setErrorMessage("Could not connect to the doctor call service.");
        setStageBoth("error");
        cleanupSocket("connect_error");
      });
    } catch (err: any) {
      log("startCall FAILED:", err);
      setErrorMessage(err?.data?.message ?? "Could not start consultation");
      setStageBoth("error");
    }
  }, [cleanupSocket, initiateConsultation, registerListeners, reportStatus, setStageBoth]);

  const cancelCall = useCallback(() => {
    const s = sessionRef.current;
    if (s && socketRef.current) {
      socketRef.current.emit("PATIENT_CALL_CANCELLED", { roomID: s.roomId });
      log("emitted PATIENT_CALL_CANCELLED (explicit patient cancel):", s.roomId);
    }
    reportStatus(ConsultationStatus.CANCELLED);
    cleanupSocket("patient cancelled");
    setIncomingCall(null);
    setPendingRoomId(null);
    setStageBoth("idle");
  }, [cleanupSocket, reportStatus, setStageBoth]);

  const endCall = useCallback(() => {
    jitsiApiRef.current?.dispose();
    jitsiApiRef.current = null;
    reportStatus(ConsultationStatus.COMPLETED, { callEndedAt: new Date().toISOString() });
    cleanupSocket("call ended");
    setStageBoth("ended");
  }, [cleanupSocket, reportStatus, setStageBoth]);

  const acceptIncomingCall = useCallback(() => {
    if (!incomingCall || !socketRef.current) {
      log("acceptIncomingCall called but no incomingCall/socket — ignoring");
      return;
    }

    log("accepting incoming call:", incomingCall);
    socketRef.current.emit("PATIENT_CALL_ACCEPTED", {
      doctorID: incomingCall.doctorID,
      roomID: incomingCall.roomID,
    });

    setDoctorInfo({
      firstName: { en: incomingCall.doctorName, bn: "" },
      lastName: { en: "", bn: "" },
      image: incomingCall.docImage,
    });

    reportStatus(ConsultationStatus.ACCEPTED, { callStartedAt: new Date().toISOString() });
    setStageBoth("accepted");
    requestJoinJitsi(incomingCall.roomID);
    setIncomingCall(null);
  }, [incomingCall, requestJoinJitsi, reportStatus, setStageBoth]);

  const rejectIncomingCall = useCallback(() => {
    if (!incomingCall || !socketRef.current) {
      log("rejectIncomingCall called but no incomingCall/socket — ignoring");
      return;
    }

    log("rejecting incoming call:", incomingCall);
    socketRef.current.emit("PATIENT_CALL_REJECTED", {
      doctorID: incomingCall.doctorID,
      roomID: incomingCall.roomID,
    });

    reportStatus(ConsultationStatus.REJECTED);
    setIncomingCall(null);
  }, [incomingCall, reportStatus]);

  useEffect(() => {
    return () => {
      cleanupSocket("component unmounted");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    stage,
    doctorInfo,
    errorMessage,
    startCall,
    cancelCall,
    endCall,
    incomingCall,
    acceptIncomingCall,
    rejectIncomingCall,
  };
}