import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/auth.service";
import { SettingsSection } from "./SettingsSection";
import { AutoSaveField } from "./AutoSaveField";
import { useAutoSave } from "@/hooks/useAutoSave";

export function ProfileSection() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);

  const { value, setValue, status, errorMessage } = useAutoSave<string>({
    initialValue: user?.name ?? "",
    onSave: async (next) => {
      if (!accessToken) throw new Error("Not authenticated");
      const { user: updated } = await authService.updateProfile(accessToken, { name: next });
      setUser(updated, accessToken);
    },
  });

  return (
    <SettingsSection
      id="account"
      title="Account"
      description="Your account details. Applied across every household you're a member of."
    >
      <AutoSaveField
        label="Name"
        htmlFor="profile-name"
        status={status}
        errorMessage={errorMessage}
      >
        <Input
          id="profile-name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={status === "error"}
        />
      </AutoSaveField>
      <div className="text-sm text-foreground/40">{user?.email}</div>
    </SettingsSection>
  );
}
