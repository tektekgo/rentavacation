// Role Badge Component - Contextual display of user roles
import { Badge } from "@/components/ui/badge";
import { Crown, ShieldCheck, Briefcase, Home, User } from "lucide-react";
import type { AppRole } from "@/types/database";

interface RoleBadgeProps {
  role: AppRole;
  variant?: "full" | "compact" | "icon-only";
  className?: string;
}

const ROLE_CONFIG: Record<AppRole, {
  label: string;
  shortLabel: string;
  icon: typeof Crown;
  className: string;
}> = {
  rav_owner: {
    label: "RAV Owner",
    shortLabel: "Owner",
    icon: Crown,
    className: "bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-400",
  },
  rav_admin: {
    label: "RAV Admin",
    shortLabel: "Admin",
    icon: ShieldCheck,
    className: "bg-gradient-to-r from-purple-500 to-violet-500 text-white border-purple-400",
  },
  rav_staff: {
    label: "RAV Staff",
    shortLabel: "Staff",
    icon: Briefcase,
    className: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-400",
  },
  property_owner: {
    label: "Verified Owner",
    shortLabel: "Owner",
    icon: Home,
    className: "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-emerald-400",
  },
  renter: {
    label: "Traveler",
    shortLabel: "Traveler",
    icon: User,
    className: "bg-gradient-to-r from-sky-500 to-blue-500 text-white border-sky-400",
  },
};

export function RoleBadge({ role, variant = "full", className = "" }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role];
  if (!config) return null;

  const Icon = config.icon;

  if (variant === "icon-only") {
    return (
      <div 
        className={`w-6 h-6 rounded-full flex items-center justify-center ${config.className} ${className}`}
        title={config.label}
      >
        <Icon className="h-3 w-3" />
      </div>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${className} text-xs font-medium border`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {variant === "compact" ? config.shortLabel : config.label}
    </Badge>
  );
}

// Get the highest priority role for display
export function getDisplayRole(roles: AppRole[]): AppRole | null {
  const priority: AppRole[] = ['rav_owner', 'rav_admin', 'rav_staff', 'property_owner', 'renter'];
  
  for (const role of priority) {
    if (roles.includes(role)) {
      return role;
    }
  }
  
  return null;
}

// Verified Owner badge for listings - simplified public-facing version
export function VerifiedOwnerBadge({ className = "" }: { className?: string }) {
  return (
    <Badge 
      variant="outline" 
      className={`bg-emerald-500/10 text-emerald-600 border-emerald-200 text-xs font-medium ${className}`}
    >
      <Home className="h-3 w-3 mr-1" />
      Verified Owner
    </Badge>
  );
}

// Traveler badge for bidding context
export function TravelerBadge({ className = "" }: { className?: string }) {
  return (
    <Badge 
      variant="outline" 
      className={`bg-sky-500/10 text-sky-600 border-sky-200 text-xs font-medium ${className}`}
    >
      <User className="h-3 w-3 mr-1" />
      Traveler
    </Badge>
  );
}
