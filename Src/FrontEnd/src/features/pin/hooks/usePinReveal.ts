import { useCallback, useEffect, useRef, useState } from "react";
import type { PinDocumentType, PinStatusResponse } from "@/features/pin/types";
import { getPinStatus } from "@/features/pin/services/pinService";
import { verifyPinViewDocument } from "@/features/pin/services/pinService";

export const PIN_DIGIT_COUNT = 6;
export const REVEAL_DURATION_SECONDS = 30;

export type PinRevealMode = "verify" | "setup";

export interface UsePinRevealResult {
  plaintext: string | null;
  isRevealed: boolean;
  secondsLeft: number;
  isModalOpen: boolean;
  isPinSet: boolean;
  mode: PinRevealMode;
  openModal: () => Promise<void>;
  closeModal: () => void;
  handleVerified: (pinCode: string) => Promise<boolean>;
  handleSetupDone: () => void;
  hide: () => void;
}

export function usePinReveal(documentType: PinDocumentType): UsePinRevealResult {
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(REVEAL_DURATION_SECONDS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPinSet, setIsPinSet] = useState(true);
  const [mode, setMode] = useState<PinRevealMode>("verify");
  const timerRef = useRef<number | null>(null);

  const hide = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPlaintext(null);
    setSecondsLeft(REVEAL_DURATION_SECONDS);
  }, []);

  useEffect(() => {
    if (plaintext === null) {
      return;
    }
    timerRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current !== null) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setPlaintext(null);
          return REVEAL_DURATION_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [plaintext]);

  const openModal = useCallback(async () => {
    hide();
    try {
      const status = await getPinStatus();
      setIsPinSet(status.isPinSet);
      setMode(status.isPinSet ? "verify" : "setup");
    } catch {
      setMode("setup");
    }
    setIsModalOpen(true);
  }, [hide]);

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const handleVerified = useCallback(
    async (pinCode: string): Promise<boolean> => {
      try {
        const result = await verifyPinViewDocument({ pinCode, documentType });
        setPlaintext(result.documentNumber);
        setSecondsLeft(REVEAL_DURATION_SECONDS);
        setIsModalOpen(false);
        return true;
      } catch {
        return false;
      }
    },
    [documentType],
  );

  const handleSetupDone = useCallback(() => {
    setIsPinSet(true);
    setMode("verify");
  }, []);

  return {
    plaintext,
    isRevealed: plaintext !== null,
    secondsLeft,
    isModalOpen,
    isPinSet,
    mode,
    openModal,
    closeModal,
    handleVerified,
    handleSetupDone,
    hide,
  };
}
