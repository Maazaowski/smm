import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "accent";
}

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
        variant === "default" &&
          "bg-surface-2 text-secondary border border-glass-border hover:text-primary",
        variant === "accent" &&
          "bg-accent-blue/10 text-accent-blue border border-accent-blue/20",
        className
      )}
    >
      {children}
    </span>
  );
}
