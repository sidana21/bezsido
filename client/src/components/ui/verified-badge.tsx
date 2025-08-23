import verificationIcon from "@assets/تنزيل (1)_1755951224424.png";

interface VerifiedBadgeProps {
  className?: string;
  title?: string;
}

export function VerifiedBadge({ className = "w-4 h-4", title = "حساب موثق" }: VerifiedBadgeProps) {
  return (
    <img 
      src={verificationIcon}
      alt="verified"
      className={className}
      title={title}
      data-testid="badge-verified"
    />
  );
}