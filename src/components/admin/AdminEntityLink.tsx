/**
 * Clickable entity name for admin cross-tab navigation.
 * Renders as a styled button that navigates to the target tab with search pre-filled.
 */

export interface AdminNavigationProps {
  initialSearch?: string;
  onNavigateToEntity?: (tab: string, search?: string) => void;
}

interface AdminEntityLinkProps {
  /** The name/text to display */
  children: React.ReactNode;
  /** Target admin tab (e.g., 'users', 'bookings', 'listings') */
  tab: string;
  /** Search term to pre-fill (typically the entity name or email) */
  search: string;
  /** Navigation callback from AdminDashboard */
  onNavigate?: (tab: string, search?: string) => void;
  /** Additional CSS classes */
  className?: string;
}

export function AdminEntityLink({ children, tab, search, onNavigate, className = "" }: AdminEntityLinkProps) {
  if (!onNavigate) {
    return <span className={className}>{children}</span>;
  }

  return (
    <button
      type="button"
      onClick={() => onNavigate(tab, search)}
      className={`text-left hover:underline hover:text-primary transition-colors cursor-pointer ${className}`}
      title={`View in ${tab}`}
    >
      {children}
    </button>
  );
}
