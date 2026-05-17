import * as React from "react";
import { Input } from "./input";

type Props = Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value: number | null | undefined;
  onValueChange: (value: number) => void;
  /** If true (default), display empty when value === 0 so the user can type without deleting a leading 0. */
  blankOnZero?: boolean;
};

/**
 * Controlled numeric input that never shows a stuck "0".
 *
 * - Keeps its own string state so clearing the field leaves it empty in the UI,
 *   even though the parent receives 0.
 * - Syncs back from props when the parent value changes for a reason other than
 *   the user's own typing (PDF extraction, loading saved data, etc).
 */
const NumberInput = React.forwardRef<HTMLInputElement, Props>(
  ({ value, onValueChange, blankOnZero = true, ...rest }, ref) => {
    const toDisplay = (v: number | null | undefined) => {
      if (v === null || v === undefined) return "";
      if (blankOnZero && v === 0) return "";
      return String(v);
    };

    const [local, setLocal] = React.useState<string>(() => toDisplay(value));

    // Sync from parent when the external value diverges from what's typed.
    React.useEffect(() => {
      const parsed = local === "" || local === "-" ? 0 : Number(local);
      if (Number.isNaN(parsed) || parsed !== (value ?? 0)) {
        setLocal(toDisplay(value));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return (
      <Input
        {...rest}
        ref={ref}
        type="number"
        value={local}
        onChange={(e) => {
          const str = e.target.value;
          setLocal(str);
          if (str === "" || str === "-") {
            onValueChange(0);
            return;
          }
          const n = Number(str);
          if (!Number.isNaN(n)) onValueChange(n);
        }}
      />
    );
  },
);
NumberInput.displayName = "NumberInput";

export { NumberInput };