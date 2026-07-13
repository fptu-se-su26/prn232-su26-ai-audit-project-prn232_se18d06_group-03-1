import type { ComponentProps } from "react";
import AddressAutocomplete from "@/features/locations/components/AddressAutocomplete";

type AddressTextAutocompleteProps = Omit<
  ComponentProps<typeof AddressAutocomplete>,
  "onSelect" | "resolveCoordinates"
> & {
  onSelect?: (address: string, placeId: string) => void;
};

export default function AddressTextAutocomplete({ onSelect, ...props }: AddressTextAutocompleteProps) {
  return (
    <AddressAutocomplete
      {...props}
      resolveCoordinates={false}
      onSelect={(selected) => onSelect?.(selected.address, selected.placeId)}
    />
  );
}
