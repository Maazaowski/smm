export function Callout(props: React.ComponentProps<"blockquote">) {
  return (
    <blockquote
      {...props}
      className="my-6 rounded-xl border border-accent-blue/20 bg-accent-blue/[0.05] px-6 py-4 text-secondary [&>p]:m-0"
    />
  );
}
