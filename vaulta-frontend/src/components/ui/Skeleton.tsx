type SkeletonVariant = 'text' | 'circle' | 'rect';

interface SkeletonProps {
  className?: string;
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
}

const variantClasses: Record<SkeletonVariant, string> = {
  text: 'rounded-md',
  circle: 'rounded-full',
  rect: 'rounded-xl',
};

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  return (
    <div
      className={`
        bg-gradient-to-r from-white/5 via-white/10 to-white/5
        bg-[length:200%_100%] animate-shimmer
        ${variantClasses[variant]}
        ${className}
      `}
      style={{
        width: width ?? (variant === 'circle' ? 40 : '100%'),
        height:
          height ??
          (variant === 'text' ? 16 : variant === 'circle' ? 40 : 80),
      }}
    />
  );
}
