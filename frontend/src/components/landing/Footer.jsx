import { Link } from "react-router-dom";

const LINKS = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Changelog", href: "#" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Interview Tips", href: "#" },
    { label: "Career Guide", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "Refund Policy", href: "#" },
  ],
};

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const SOCIALS = [
  { Icon: GithubIcon, href: "https://github.com/Aayushh910/InterviewIQ", label: "GitHub" },
  { Icon: LinkedInIcon, href: "#", label: "LinkedIn" },
  { Icon: MailIcon, href: "mailto:contact@interviewiq.ai", label: "Email" },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 focus-visible:outline-none" aria-label="InterviewIQ">
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
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0F] border-t border-white/5" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-[#8B8FA8] leading-relaxed max-w-xs">
              AI-powered mock interview platform that helps candidates prepare smarter and get hired faster.
            </p>
            <div className="flex gap-2.5 mt-5">
              {SOCIALS.map(({ Icon, href, label }) => (
                <a key={label} href={href} aria-label={label} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl border border-white/8 flex items-center justify-center text-[#8B8FA8] hover:text-[#F5A623] hover:border-[#F5A623]/30 hover:bg-[#F5A623]/5 transition-all duration-200">
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(LINKS).map(([group, items]) => (
            <div key={group}>
              <h3 className="text-xs font-bold text-[#F4F2EE] uppercase tracking-widest mb-4">{group}</h3>
              <ul className="space-y-2.5" role="list">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="text-sm text-[#8B8FA8] hover:text-[#F4F2EE] transition-colors duration-150">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#8B8FA8]">
            © {new Date().getFullYear()} InterviewIQ. All rights reserved. Built by{" "}
            <a href="https://github.com/Aayushh910" className="text-[#F5A623] font-medium hover:text-[#f0b84a] transition-colors"
              target="_blank" rel="noopener noreferrer">
              Aayush Savaliya
            </a>
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A8E063] animate-pulse" />
            <span className="text-xs text-[#8B8FA8]">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
