import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Button from "./Button";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Pricing", href: "#pricing", badge: "Soon" },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 focus-visible:outline-none" aria-label="InterviewIQ Home">
      <div className="relative w-9 h-9">
        <div className="absolute inset-0 rounded-xl bg-[#F5A623] blur-md opacity-40" />
        <div className="relative w-9 h-9 rounded-xl bg-[#1E1E2E] border border-[#F5A623]/30 flex items-center justify-center shadow-[0_0_12px_rgba(245,166,35,0.3)]">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M9 1.5L11.8 7H17L12.5 10.8L14.2 16.5L9 13.2L3.8 16.5L5.5 10.8L1 7H6.2L9 1.5Z" fill="#F5A623" />
          </svg>
        </div>
      </div>
      <span className="font-bold text-[#F4F2EE] text-lg tracking-tight">
        Interview<span className="text-[#F5A623]">IQ</span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href) => {
    setMobileOpen(false);
    if (!isLanding) return;
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      role="banner"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0F0F14]/90 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" aria-label="Main navigation">
        <Logo />

        <ul className="hidden md:flex items-center gap-1" role="list">
          {NAV_LINKS.map(({ label, href, badge }) => (
            <li key={label}>
              <button
                onClick={() => handleNav(href)}
                className="relative px-3.5 py-2 text-sm font-medium text-[#8B8FA8] hover:text-[#F4F2EE] rounded-lg hover:bg-white/5 transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
              >
                {label}
                {badge && (
                  <span className="text-[9px] font-bold bg-[#F5A623]/15 text-[#F5A623] px-1.5 py-0.5 rounded-full border border-[#F5A623]/25">
                    {badge}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-2">
          <Button as={Link} to="/login" variant="ghost" size="sm">Login</Button>
          <Button as={Link} to="/signup" variant="primary" size="sm">Get Started</Button>
        </div>

        <button
          className="md:hidden p-2 rounded-lg text-[#8B8FA8] hover:text-[#F4F2EE] hover:bg-white/5 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden bg-[#0F0F14]/95 backdrop-blur-xl border-b border-white/5">
          <ul className="px-4 py-3 flex flex-col gap-1" role="list">
            {NAV_LINKS.map(({ label, href, badge }) => (
              <li key={label}>
                <button
                  onClick={() => handleNav(href)}
                  className="w-full text-left px-3 py-2.5 text-sm font-medium text-[#8B8FA8] hover:text-[#F4F2EE] hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
                >
                  {label}
                  {badge && <span className="text-[9px] font-bold bg-[#F5A623]/15 text-[#F5A623] px-1.5 py-0.5 rounded-full">{badge}</span>}
                </button>
              </li>
            ))}
          </ul>
          <div className="px-4 pb-4 flex flex-col gap-2">
            <Button as={Link} to="/login" variant="secondary" size="md" className="w-full justify-center">Login</Button>
            <Button as={Link} to="/signup" variant="primary" size="md" className="w-full justify-center">Get Started</Button>
          </div>
        </div>
      )}
    </header>
  );
}
