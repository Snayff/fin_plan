interface Props {
  hasFailures: boolean;
}

export function NetworkStatusBanner({ hasFailures }: Props) {
  if (!hasFailures) return null;
  return (
    <div
      role="alert"
      className="rounded-md border border-attention/40 bg-attention/5 px-4 py-2.5 text-sm text-attention"
    >
      Changes may not be saving — check your connection.
    </div>
  );
}
