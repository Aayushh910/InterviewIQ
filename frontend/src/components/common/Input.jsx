export default function Input({ label, error, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[#1F2937]">{label}</label>
      )}
      <input
        className={`w-full px-4 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-[#1F2937] text-sm placeholder:text-[#6B7280] transition-all duration-200 focus:outline-none focus:border-[#3CAEA3] focus:ring-2 focus:ring-[#3CAEA3]/20 ${error ? "border-[#ED553B] focus:border-[#ED553B] focus:ring-[#ED553B]/20" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-[#ED553B]">{error}</p>}
    </div>
  );
}
