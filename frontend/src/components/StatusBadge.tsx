import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: 'maintained' | 'pending' | 'warning';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'maintained':
        return {
          label: 'Maintained',
          className: 'bg-success text-success-foreground'
        };
      case 'pending':
        return {
          label: 'Pending',
          className: 'bg-warning text-warning-foreground'
        };
      case 'warning':
        return {
          label: 'Warning',
          className: 'bg-danger text-danger-foreground'
        };
      default:
        return {
          label: status,
          className: 'bg-muted text-muted-foreground'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};