import { INTERVIEW_MODES } from './interviewModes';

export { INTERVIEW_MODES };
export const INTERVIEW_TYPES = INTERVIEW_MODES;

export const APP_NAME = "InterviewIQ";
export const APP_TAGLINE = "AI-Powered Interview Performance Analyzer & Advisor";

export const NAV_LINKS = [
  { name: "Live Demo", href: "#demo-preview" },
  { name: "Features", href: "#features" },
  { name: "How It Works", href: "#how-it-works" },
  { name: "Interview Modes", href: "#interview-types" },
  { name: "Analytics", href: "#analytics" },
  { name: "Testimonials", href: "#testimonials" },
];

export const WORKSPACE_NAV = [
  { name: "Dashboard", path: "/dashboard", icon: "LayoutDashboard" },
  { name: "Interviews", path: "/interviews", icon: "Video" },
  { name: "Resume Studio", path: "/resume", icon: "Sparkles" },
  { name: "AI Coach", path: "/coach", icon: "BotMessageSquare" },
  { name: "Analytics", path: "/analytics", icon: "BarChart3" },
  { name: "Reports", path: "/reports", icon: "FileText" },
  { name: "History", path: "/interviews/history", icon: "History" },
  { name: "Learning", path: "/learning", icon: "GraduationCap" },
  { name: "Achievements", path: "/achievements", icon: "Award" },
  { name: "Profile", path: "/profile", icon: "User" },
  { name: "Settings", path: "/settings", icon: "Settings" },
];

export const ADMIN_NAV = [
  { name: "Overview", path: "/admin", icon: "ShieldAlert" },
  { name: "User Management", path: "/admin/users", icon: "Users" },
  { name: "AI Engine Health", path: "/admin/system", icon: "Cpu" },
  { name: "API Usage Logs", path: "/admin/logs", icon: "Terminal" },
  { name: "Settings", path: "/admin/settings", icon: "Sliders" },
];

export const FEATURES_LIST = [
  {
    title: "Facial Expression Analysis",
    description: "Tracks eye contact, posture, facial expressions and confidence during interviews.",
    icon: "Eye",
  },
  {
    title: "Voice & Communication Analysis",
    description: "Evaluates speech clarity, speaking pace, filler words, pronunciation and confidence.",
    icon: "Mic",
  },
  {
    title: "AI Answer Evaluation",
    description: "Scores technical answers, HR responses, STAR structure and communication quality.",
    icon: "Cpu",
  },
  {
    title: "Adaptive AI Interviewer",
    description: "Generates intelligent follow-up questions based on previous answers.",
    icon: "Bot",
  },
  {
    title: "Performance Analytics",
    description: "Visualises communication, confidence and technical performance using interactive dashboards.",
    icon: "Activity",
  },
  {
    title: "Personalized AI Feedback",
    description: "Generates improvement tips, AI learning roadmap and downloadable PDF reports.",
    icon: "Compass",
  },
];

export const TESTIMONIALS = [
  {
    quote: "InterviewIQ's Resume-Based interview mode cross-examined my actual CV projects down to the trade-offs. I stopped stuttering and landed a Staff Engineer offer!",
    author: "Elena Rostova",
    role: "Staff Engineer @ Google",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    quote: "The Job Description interview mode matched the exact requirements of Meta's hiring loop. The facial composure and eye contact analysis was game-changing.",
    author: "David Chen",
    role: "Senior Engineering Manager @ Meta",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    quote: "The downloadable PDF performance report and speech feedback helped me fix my filler words before my final executive interview.",
    author: "Sarah Jenkins",
    role: "Principal Architect @ Stripe",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  },
];
