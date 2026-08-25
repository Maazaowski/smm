import { DeskShell } from "@/components/proto/desk/desk-shell";
import { Editor } from "@/components/proto/desk/editor";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <DeskShell section="editor">
      <Editor id={id} />
    </DeskShell>
  );
}
