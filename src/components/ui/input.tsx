import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onFocus, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        onFocus={(e) => {
          if (type === "number") {
            // Chrome ignores select() on <input type="number"> when called
            // synchronously inside onFocus. Briefly swap to type="text",
            // select the contents, then swap back. This is the only fully
            // reliable way to highlight the whole value so the next keystroke
            // replaces it (instead of being appended to a stray "0").
            const el = e.currentTarget;
            try {
              el.type = "text";
              el.select();
              el.type = "number";
            } catch {
              // ignore — fallback to default behaviour
            }
          }
          onFocus?.(e);
        }}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
