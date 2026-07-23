import { Outlet, Link } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#0F0F14] flex flex-col">
      <header className="px-6 py-4">
        <Link to="/" className="inline-flex items-center gap-2.5 focus-visible:outline-none" aria-label="InterviewIQ Home">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-lg bg-[#F5A623] blur-md opacity-30" />
            <div className="relative w-8 h-8 rounded-lg bg-[#1E1E2E] border border-[#F5A623]/25 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M9 1.5L11.8 7H17L12.5 10.8L14.2 16.5L9 13.2L3.8 16.5L5.5 10.8L1 7H6.2L9 1.5Z" fill="#F5A623" />
              </svg>
            </div>
          </div>
          <span className="font-bold text-[#F4F2EE] text-lg tracking-tight">
            Interview<span className="text-[#F5A623]">IQ</span>
          </span>
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Outlet />
      </div>
    </div>
  );
}
