import { Toaster as SonnerToaster } from "sonner";

/**
 * Project-configured toast container.
 * Animations: fade-up entrance (150ms ease-out), fade-out exit (150ms ease-in).
 * Reduced-motion: animations disabled via global CSS media query.
 * Place once in the root layout.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      toastOptions={{
        duration: 4000,
        style: { fontFamily: '"Nunito Sans", system-ui, sans-serif', fontSize: "14px" },
      }}
    />
  );
}
