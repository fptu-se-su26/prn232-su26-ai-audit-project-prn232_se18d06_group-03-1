import { useState, useEffect, useCallback } from "react";
import { getMyApplication, createApplication, uploadNationalId, updateBankInfo, submitApplication } from "@/features/owner/services/ownerService";
import type { OwnerApplicationDto, OwnerWizardStep, NationalIdOcrResult } from "@/features/owner/types";

export function useOwnerApplication(stepParam?: string | null) {
  const [application, setApplication] = useState<OwnerApplicationDto | null>(null);
  const [wizardStep, setWizardStep] = useState<OwnerWizardStep>("check-status");
  const [ocrResult, setOcrResult] = useState<NationalIdOcrResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ensureApplication = useCallback(async (): Promise<OwnerApplicationDto | null> => {
    try {
      const app = await getMyApplication();
      if (app?.id && app.id > 0) return app;
    } catch {
      // no application exists
    }
    try {
      await createApplication();
      return await getMyApplication();
    } catch {
      return null;
    }
  }, []);

  const fetchApplication = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const app = await ensureApplication();
      setApplication(app);

      if (!app) {
        setWizardStep("check-status");
        return;
      }

      if (app.isOwner) {
        setWizardStep("already-owner");
        return;
      }

      if (stepParam === "upload") {
        setWizardStep("upload");
      } else if (stepParam === "bank") {
        setWizardStep("bank-info");
      } else {
        setWizardStep("check-status");
      }
    } catch {
      setApplication(null);
      setWizardStep("check-status");
    } finally {
      setIsLoading(false);
    }
  }, [stepParam, ensureApplication]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const refetch = useCallback(async () => {
    try {
      const app = await ensureApplication();
      setApplication(app);
      return app;
    } catch {
      return null;
    }
  }, [ensureApplication]);

  const handleOcrVerification = useCallback(
    async (frontImage: File, backImage: File) => {
      setIsLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("FrontImage", frontImage);
        formData.append("BackImage", backImage);
        const result = await uploadNationalId(formData);
        setOcrResult(result);
        setWizardStep("success");
        return result;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Tải ảnh thất bại. Vui lòng thử lại.";
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const handleBankUpdate = useCallback(
    async (bankName: string, bankAccountNumber: string, bankAccountHolderName: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await updateBankInfo({ bankName, bankAccountNumber, bankAccountHolderName });
        const updated = await refetch();
        if (updated?.isOwner) {
          setWizardStep("owner-success");
        } else if (updated?.nationalIdVerified && updated?.bankInfoCompleted) {
          setWizardStep("review-submit");
        } else {
          setWizardStep("check-status");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Cập nhật thông tin ngân hàng thất bại.";
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [refetch],
  );

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await submitApplication();
      setWizardStep("owner-success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gửi hồ sơ thất bại.";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    application,
    wizardStep,
    setWizardStep,
    ocrResult,
    isLoading,
    error,
    setError,
    refetch,
    handleOcrVerification,
    handleBankUpdate,
    handleSubmit,
  };
}
