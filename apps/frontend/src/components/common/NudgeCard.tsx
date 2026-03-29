import { motion } from "framer-motion";

interface NudgeCardProps {
  message: string;
  options?: string[];
  actionLabel?: string;
  onAction?: () => void;
}

export function NudgeCard({ message, options, actionLabel, onAction }: NudgeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="rounded-md p-3 text-xs space-y-2 bg-attention-bg border border-attention-border"
    >
      <div className="flex items-start gap-1.5">
        <span className="mt-0.5 h-[5px] w-[5px] rounded-full shrink-0 bg-attention" aria-hidden />
        <p>{message}</p>
      </div>
      {options && options.length > 0 && (
        <ul className="pl-4 space-y-0.5 list-disc">
          {options.map((opt) => (
            <li key={opt}>{opt}</li>
          ))}
        </ul>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="underline underline-offset-2 hover:no-underline text-xs text-attention"
          type="button"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
