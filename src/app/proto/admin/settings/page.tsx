import { DeskShell } from "@/components/proto/desk/desk-shell";
import { Settings } from "@/components/proto/desk/settings";

export default function SettingsPage() {
  return (
    <DeskShell section="settings">
      <Settings />
    </DeskShell>
  );
}
