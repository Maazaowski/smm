import { DeskShell } from "@/components/proto/desk/desk-shell";
import { DeskIndex } from "@/components/proto/desk/desk-index";

export default function DeskPage() {
  return (
    <DeskShell section="desk">
      <DeskIndex />
    </DeskShell>
  );
}
