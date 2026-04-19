import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccountsByType } from "@/hooks/useAssets";

interface Props {
  value: string | null | undefined;
  onChange: (accountId: string | null) => void;
}

const NONE_VALUE = "__none__";

const labelClass = "text-text-muted uppercase tracking-[0.07em] text-[10px]";

export function LinkedAccountPicker({ value, onChange }: Props) {
  const { data: savingsAccounts = [] } = useAccountsByType("Savings");
  const { data: ssAccounts = [] } = useAccountsByType("StocksAndShares");
  const { data: pensionAccounts = [] } = useAccountsByType("Pension");

  const hasAnyAccounts =
    savingsAccounts.length > 0 || ssAccounts.length > 0 || pensionAccounts.length > 0;

  return (
    <div className="col-span-2 flex flex-col gap-1">
      <label className={labelClass}>Link to account</label>
      <Select
        value={value ?? NONE_VALUE}
        onValueChange={(v) => onChange(v === NONE_VALUE ? null : v)}
      >
        <SelectTrigger
          aria-label="Link to account"
          className="h-auto rounded-md border-foreground/10 bg-foreground/[0.04] py-1.5 text-sm focus:ring-page-accent/40"
        >
          <SelectValue placeholder="None — no account linked" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>
            <span className="text-text-muted italic">None</span>
          </SelectItem>

          {!hasAnyAccounts && (
            <div className="px-3 py-2 text-xs text-text-muted italic">
              No savings, S&S or pension accounts found
            </div>
          )}

          {savingsAccounts.length > 0 && (
            <SelectGroup>
              <SelectLabel>Savings</SelectLabel>
              {savingsAccounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}

          {ssAccounts.length > 0 && (
            <SelectGroup>
              <SelectLabel>Stocks &amp; Shares</SelectLabel>
              {ssAccounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}

          {pensionAccounts.length > 0 && (
            <SelectGroup>
              <SelectLabel>Pension</SelectLabel>
              {pensionAccounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
