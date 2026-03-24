import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/auth.service";
import { Section } from "./Section";

export function ProfileSection() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!accessToken) return;
    setSaving(true);
    try {
      const { user: updated } = await authService.updateProfile(accessToken, { name });
      setUser(updated, accessToken);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section id="profile" title="Profile">
      <div className="space-y-3 max-w-sm">
        <div className="space-y-1">
          <label htmlFor="profile-name" className="text-sm font-medium">
            Name
          </label>
          <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </Section>
  );
}
