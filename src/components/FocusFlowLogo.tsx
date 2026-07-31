interface FocusFlowLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export function FocusFlowLogo({ size = 'md', showText = false, className = '' }: FocusFlowLogoProps) {
  const sizeClasses = {
    sm: 'w-7 h-7 text-sm rounded-[22%]',
    md: 'w-9 h-9 text-lg rounded-[22%]',
    lg: 'w-12 h-12 text-2xl rounded-[22%]',
    xl: 'w-16 h-16 text-3xl rounded-[22%]',
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div
        className={`${sizeClasses[size]} bg-gradient-to-br from-[#8C52FF] via-[#5B76FF] to-[#38BDF8] flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/30 tracking-normal flex-shrink-0 font-sans select-none border border-white/10`}
      >
        F
      </div>
      {showText && (
        <span className="font-display font-extrabold text-lg md:text-xl tracking-tight text-white">
          FocusFlow
        </span>
      )}
    </div>
  );
}
