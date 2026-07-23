export default function Loader({ size = "md", className = "" }) {
  const s = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" }[size];
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`${s} rounded-full border-2 border-[#E5E7EB] border-t-[#3CAEA3] animate-spin ${className}`}
    />
  );
}
