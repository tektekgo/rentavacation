import type { ReactNode } from "react";
import { CheckCircle2, Mail, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionSuccessAction {
  label: string;
  onClick?: () => void;
  variant?: "default" | "outline";
}

interface ActionSuccessCardProps {
  icon?: LucideIcon;
  iconClassName?: string;
  title: string;
  description: string | ReactNode;
  referenceLabel?: string;
  referenceValue?: string;
  emailSent?: boolean;
  actions?: ActionSuccessAction[];
}

export function ActionSuccessCard({
  icon: Icon = CheckCircle2,
  iconClassName = "text-green-500",
  title,
  description,
  referenceLabel,
  referenceValue,
  emailSent,
  actions,
}: ActionSuccessCardProps) {
  return (
    <div className="flex flex-col items-center text-center py-6 px-4 space-y-4">
      <Icon className={`h-12 w-12 ${iconClassName}`} />

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="text-sm text-muted-foreground max-w-sm">
          {description}
        </div>
      </div>

      {referenceLabel && referenceValue && (
        <div className="bg-muted/50 rounded-lg px-6 py-3 text-sm">
          <span className="text-muted-foreground">{referenceLabel}: </span>
          <span className="font-semibold">{referenceValue}</span>
        </div>
      )}

      {emailSent && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>Confirmation email sent</span>
        </div>
      )}

      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant || "default"}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
