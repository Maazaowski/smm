export function Callout(props: React.ComponentProps<"blockquote">) {
  return (
    <blockquote
      {...props}
      className="my-8 rounded-r-xl border-l-[3px] border-accent-blue bg-accent-blue/[0.06] px-6 py-4 font-display text-lg italic leading-relaxed text-primary [&>p]:m-0"
    />
  );
}
