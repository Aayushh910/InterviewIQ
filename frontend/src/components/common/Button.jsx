const variants = {
  primary: "bg-[#F5A623] text-[#0F0F14] hover:bg-[#f0b84a] shadow-[0_4px_16px_rgba(245,166,35,0.35)] hover:shadow-[0_6px_24px_rgba(245,166,35,0.5)] active:scale-[0.98]",
  secondary: "bg-[#1E1E2E] text-[#F4F2EE] border border-white/10 hover:border-white/20 hover:bg-[#252535] shadow-[0_2px_8px_rgba(0,0,0,0.3)]",
  accent: "bg-[#FF6B6B] text-white hover:bg-[#ff5252] shadow-[0_4px_16px_rgba(255,107,107,0.35)]",
  ghost: "text-[#8B8FA8] hover:text-[#F4F2EE] hover:bg-white/5",
  danger: "bg-[#FF6B6B] text-white hover:bg-[#ff5252] shadow-[0_2px_8px_rgba(255,107,107,0.3)]",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export default function Button({ children, variant = "primary", size = "md", className = "", as: Tag = "button", ...props }) {
  return (
    <Tag
      className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#F5A623] focus-visible:outline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
