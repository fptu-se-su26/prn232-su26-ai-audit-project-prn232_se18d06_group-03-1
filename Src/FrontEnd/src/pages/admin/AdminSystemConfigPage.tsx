import { useEffect, useMemo, useState } from "react";
import { Mail, RefreshCw, Save, ShieldAlert, SlidersHorizontal, Timer, ToggleLeft } from "lucide-react";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { showToast } from "@/components/common/toastStore";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SectionPanel from "@/components/dashboard/SectionPanel";
import {
  getSystemConfigs,
  updateSystemConfigs,
  type SystemConfigItem,
} from "@/features/admin/services/systemConfigService";

const categoryIcons = {
  "Background jobs": Timer,
  Notification: Mail,
  Reminder: ToggleLeft,
  Risk: ShieldAlert,
} as const;

function formatDate(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getInputType(item: SystemConfigItem) {
  if (item.dataType === "int" || item.dataType === "decimal") return "number";
  return "text";
}

export default function AdminSystemConfigPage() {
  const [configs, setConfigs] = useState<SystemConfigItem[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function loadConfigs(silent = false) {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getSystemConfigs();
      setConfigs(data);
      setDraft(Object.fromEntries(data.map((item) => [item.configKey, item.configValue])));
    } catch {
      showToast({
        type: "error",
        title: "Không thể tải cấu hình",
        message: "Vui lòng kiểm tra backend hoặc quyền Admin.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadConfigs();
  }, []);

  const groupedConfigs = useMemo(() => {
    return configs.reduce<Record<string, SystemConfigItem[]>>((acc, item) => {
      acc[item.category] = [...(acc[item.category] ?? []), item];
      return acc;
    }, {});
  }, [configs]);

  const changedItems = useMemo(
    () => configs.filter((item) => draft[item.configKey] !== item.configValue),
    [configs, draft],
  );

  async function handleSave() {
    if (changedItems.length === 0) {
      showToast({ type: "info", title: "Chưa có thay đổi", message: "Không có cấu hình nào cần lưu." });
      return;
    }

    setSaving(true);
    try {
      const updated = await updateSystemConfigs({
        items: changedItems.map((item) => ({
          configKey: item.configKey,
          configValue: draft[item.configKey] ?? item.configValue,
        })),
      });
      setConfigs(updated);
      setDraft(Object.fromEntries(updated.map((item) => [item.configKey, item.configValue])));
      showToast({ type: "success", title: "Đã lưu cấu hình", message: `${changedItems.length} mục đã được cập nhật.` });
    } catch {
      showToast({
        type: "error",
        title: "Không thể lưu cấu hình",
        message: "Kiểm tra lại kiểu dữ liệu hoặc thử lại sau.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-10">
      <DashboardHeader
        eyebrow="System workflow"
        title="Cấu hình hệ thống"
        description="Điều chỉnh job tự động, reminder check-in/out, email notification và ngưỡng rủi ro mà không cần sửa file môi trường."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              isLoading={refreshing}
              onClick={() => void loadConfigs(true)}
              className="inline-flex items-center gap-2"
            >
              <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Làm mới
            </Button>
            <Button
              type="button"
              isLoading={saving}
              disabled={changedItems.length === 0}
              onClick={() => void handleSave()}
              className="inline-flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Lưu thay đổi
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border border-brand-200 bg-white p-5 shadow-sm shadow-slate-950/5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Đã nạp</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">{configs.length} cấu hình</p>
          <p className="mt-2 text-sm text-slate-600">Các mục hệ thống đang được quản lý.</p>
        </div>
        <div className="rounded-md border border-amber-200 bg-white p-5 shadow-sm shadow-slate-950/5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">Chưa lưu</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">{changedItems.length} thay đổi</p>
          <p className="mt-2 text-sm text-slate-600">Những thay đổi chỉ có hiệu lực sau khi lưu.</p>
        </div>
        <div className="rounded-md border border-emerald-200 bg-white p-5 shadow-sm shadow-slate-950/5 sm:col-span-2">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Phạm vi</p>
          <p className="mt-3 text-lg font-semibold text-slate-950">Auto-cancel, reminder, email và risk threshold</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Đây là nhóm cấu hình phục vụ checklist System Jobs, Notification và Dashboard/Config của phần Thành.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {Object.entries(groupedConfigs).map(([category, items]) => {
          const Icon = categoryIcons[category as keyof typeof categoryIcons] ?? SlidersHorizontal;
          return (
            <SectionPanel
              key={category}
              title={category}
              description={`${items.length} cấu hình vận hành`}
              action={
                <span className="rounded-md bg-brand-50 p-2 text-brand-700 ring-1 ring-brand-100">
                  <Icon className="h-4 w-4" />
                </span>
              }
            >
              <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  const currentValue = draft[item.configKey] ?? item.configValue;
                  const isChanged = currentValue !== item.configValue;

                  return (
                    <div key={item.configKey} className="grid gap-4 py-4 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_180px] md:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-950">{item.displayName}</h3>
                          {isChanged ? (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                              Đã chỉnh
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm leading-5 text-slate-600">{item.description}</p>
                        <p className="mt-2 text-xs font-medium text-slate-400">
                          {item.configKey} · Cập nhật {formatDate(item.updatedAt)}
                        </p>
                      </div>

                      {item.dataType === "bool" ? (
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              [item.configKey]: currentValue === "true" ? "false" : "true",
                            }))
                          }
                          className={`flex h-11 items-center justify-between rounded-md border px-3 text-sm font-semibold transition ${
                            currentValue === "true"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                        >
                          <span>{currentValue === "true" ? "Đang bật" : "Đang tắt"}</span>
                          <span
                            className={`relative h-6 w-11 rounded-full transition ${
                              currentValue === "true" ? "bg-emerald-500" : "bg-slate-300"
                            }`}
                          >
                            <span
                              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                                currentValue === "true" ? "left-6" : "left-1"
                              }`}
                            />
                          </span>
                        </button>
                      ) : (
                        <input
                          type={getInputType(item)}
                          min={0}
                          step={item.dataType === "decimal" ? "0.01" : "1"}
                          value={currentValue}
                          onChange={(event) =>
                            setDraft((prev) => ({
                              ...prev,
                              [item.configKey]: event.target.value,
                            }))
                          }
                          className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 shadow-sm shadow-slate-950/5 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </SectionPanel>
          );
        })}
      </div>
    </div>
  );
}
