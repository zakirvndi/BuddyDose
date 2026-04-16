import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * AuthCard is a centered card layout used on login and register pages.
 * Provides consistent branding header + form content + optional footer.
 */
export function AuthCard({
  title,
  description,
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      {/* Logo / Brand */}
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-6"
              aria-hidden="true"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </div>
          <span className="text-2xl font-semibold tracking-tight text-foreground">BuddyDose</span>
          <p className="text-sm text-muted-foreground">
            Your personal medication companion
          </p>
        </div>

        <Card className={cn("shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-border/50", className)}>
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-semibold">{title}</CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="pb-2">{children}</CardContent>
          {footer && (
            <div className="border-t px-4 py-3 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
