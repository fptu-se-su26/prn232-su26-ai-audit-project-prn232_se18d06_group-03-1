import { Loader2, MapPin } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import useClickOutside from "@/hooks/useClickOutside";
import useDebounce from "@/hooks/useDebounce";
import { autocompleteGoongPlaces, getGoongPlaceDetail } from "@/features/locations/services/locationService";
import type { GoongPlacePrediction } from "@/features/locations/types";

export type SelectedAddress = {
  address: string;
  latitude: number;
  longitude: number;
  placeId: string;
};

type AddressAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: SelectedAddress) => void;
  onManualChange?: () => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
};

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  onManualChange,
  label = "Địa chỉ chi tiết",
  placeholder = "Nhập địa chỉ để tìm gợi ý",
  disabled = false,
}: AddressAutocompleteProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [predictions, setPredictions] = useState<GoongPlacePrediction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const debouncedValue = useDebounce(value, 350);

  useClickOutside(rootRef, () => setIsOpen(false));

  useEffect(() => {
    let ignore = false;
    const query = debouncedValue.trim();

    if (query.length < 2 || disabled) {
      setPredictions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    autocompleteGoongPlaces(query)
      .then((items) => {
        if (ignore) return;
        setPredictions(items);
        setIsOpen(items.length > 0);
      })
      .catch(() => {
        if (ignore) return;
        setPredictions([]);
        setError("Không tải được gợi ý địa chỉ.");
        setIsOpen(true);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [debouncedValue, disabled]);

  const handleSelect = useCallback(async (prediction: GoongPlacePrediction) => {
    setIsSelecting(true);
    setError(null);
    try {
      const detail = await getGoongPlaceDetail(prediction.placeId);
      if (!detail) throw new Error("Missing place detail.");

      const address = detail.formattedAddress || prediction.description;
      onChange(address);
      onSelect({
        address,
        latitude: detail.latitude,
        longitude: detail.longitude,
        placeId: detail.placeId || prediction.placeId,
      });
      setIsOpen(false);
    } catch {
      setError("Không lấy được tọa độ địa chỉ.");
      setIsOpen(true);
    } finally {
      setIsSelecting(false);
    }
  }, [onChange, onSelect]);

  return (
    <div ref={rootRef} className="relative space-y-1">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            onManualChange?.();
            setIsOpen(true);
          }}
          onFocus={() => {
            if (predictions.length > 0 || error) setIsOpen(true);
          }}
          disabled={disabled}
          placeholder={placeholder}
          className="h-10 w-full rounded-lg border border-slate-300 px-9 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
        {(isLoading || isSelecting) && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
        )}
      </div>
      {isOpen && (predictions.length > 0 || error) && (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {error ? (
            <div className="px-3 py-2 text-sm text-red-600">{error}</div>
          ) : predictions.map((prediction) => (
            <button
              key={prediction.placeId}
              type="button"
              onClick={() => void handleSelect(prediction)}
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span>
                <span className="block font-medium text-slate-800">
                  {prediction.structuredFormatting?.mainText || prediction.description}
                </span>
                {prediction.structuredFormatting?.secondaryText && (
                  <span className="block text-xs text-slate-500">{prediction.structuredFormatting.secondaryText}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
