import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Github, Linkedin, Globe, Code2, Award, Share2, Eye, Check, X, Save, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';

export const Profile = () => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || 'Alex Rivera',
    email: user?.email || 'candidate@interviewiq.ai',
    role: user?.role || 'Senior Full-Stack Candidate',
    targetPosition: 'Staff Frontend Engineer / Tech Lead',
    bio: 'Passionate software architect with 6+ years experience in React 18, TypeScript, distributed microservices, and WebRTC streaming.',
    location: 'San Francisco, CA',
    skills: 'React, TypeScript, Node.js, GraphQL, PostgreSQL, System Design, Docker, AWS',
    education: 'B.S. in Computer Science - Stanford University (2020)',
    github: 'https://github.com/alexrivera',
    leetcode: 'https://leetcode.com/u/alexrivera',
    codeforces: 'https://codeforces.com/profile/alexrivera',
    codechef: 'https://codechef.com/users/alexrivera',
    hackerrank: 'https://hackerrank.com/alexrivera',
    linkedin: 'https://linkedin.com/in/alexrivera',
    website: 'https://alexrivera.dev',
  });

  const [savedToast, setSavedToast] = useState(false);
  const [showPublicPreview, setShowPublicPreview] = useState(false);

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-white/20 text-emerald-400 text-xs font-mono font-semibold mb-2 shadow-sm">
            <User className="w-3.5 h-3.5" /> Candidate Profile & Portfolio
          </div>
          <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
            Professional Profile & Public Showcase
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Manage your personal bio, target role, technical skills, and connect coding platform profiles for AI verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPublicPreview(true)}
            className="px-4 py-2.5 rounded-xl bg-[#141414] hover:bg-[#1f1f1f] text-neutral-200 text-xs font-mono font-semibold flex items-center gap-2 border border-white/15 transition-colors"
          >
            <Eye className="w-4 h-4 text-cyan-400" /> Public Profile Preview
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Public profile link copied to clipboard!');
            }}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs flex items-center gap-2 border border-white/20 transition-colors shadow-lg"
          >
            <Share2 className="w-4 h-4 text-black" /> Share Profile
          </button>
        </div>
      </div>

      {savedToast && (
        <div className="p-4 rounded-2xl bg-[#141414] border border-white/20 text-emerald-400 text-xs font-mono text-center shadow-md">
          Profile details saved successfully!
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Personal & Professional Details */}
        <div className="rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
          <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900 border-b border-white/10 pb-3">
            Personal & Professional Details
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-6 pb-2">
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover ring-2 ring-white/20 shrink-0"
            />
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-white dark:text-white light:text-slate-900">{formData.name}</h3>
              <p className="text-xs text-emerald-400 font-mono">{formData.role}</p>
              <p className="text-xs text-neutral-400">{formData.location}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 dark:text-neutral-300 light:text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full bg-[#141414] dark:bg-[#141414] light:bg-slate-100 border border-white/15 text-xs rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 dark:text-neutral-300 light:text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full bg-[#141414] dark:bg-[#141414] light:bg-slate-100 border border-white/15 text-xs rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 dark:text-neutral-300 light:text-slate-700 mb-1.5">
                Current Role / Title
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                className="w-full bg-[#141414] dark:bg-[#141414] light:bg-slate-100 border border-white/15 text-xs rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 dark:text-neutral-300 light:text-slate-700 mb-1.5">
                Target Target Position
              </label>
              <input
                type="text"
                value={formData.targetPosition}
                onChange={(e) => handleChange('targetPosition', e.target.value)}
                className="w-full bg-[#141414] dark:bg-[#141414] light:bg-slate-100 border border-white/15 text-xs rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 dark:text-neutral-300 light:text-slate-700 mb-1.5">
              Professional Bio
            </label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              className="w-full bg-[#141414] dark:bg-[#141414] light:bg-slate-100 border border-white/15 text-xs rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 dark:text-neutral-300 light:text-slate-700 mb-1.5">
                Skills (Comma Separated)
              </label>
              <input
                type="text"
                value={formData.skills}
                onChange={(e) => handleChange('skills', e.target.value)}
                className="w-full bg-[#141414] dark:bg-[#141414] light:bg-slate-100 border border-white/15 text-xs rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 dark:text-neutral-300 light:text-slate-700 mb-1.5">
                Education
              </label>
              <input
                type="text"
                value={formData.education}
                onChange={(e) => handleChange('education', e.target.value)}
                className="w-full bg-[#141414] dark:bg-[#141414] light:bg-slate-100 border border-white/15 text-xs rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Coding Profiles & Social Links */}
        <div className="rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
          <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900 border-b border-white/10 pb-3 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-cyan-400" /> Coding Platform Profiles & Social Links
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 dark:text-neutral-300 light:text-slate-700 mb-1.5">
                GitHub Profile URL
              </label>
              <input
                type="url"
                value={formData.github}
                onChange={(e) => handleChange('github', e.target.value)}
                className="w-full bg-[#141414] dark:bg-[#141414] light:bg-slate-100 border border-white/15 text-xs rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 dark:text-neutral-300 light:text-slate-700 mb-1.5">
                LeetCode Profile URL
              </label>
              <input
                type="url"
                value={formData.leetcode}
                onChange={(e) => handleChange('leetcode', e.target.value)}
                className="w-full bg-[#141414] dark:bg-[#141414] light:bg-slate-100 border border-white/15 text-xs rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 dark:text-neutral-300 light:text-slate-700 mb-1.5">
                Codeforces Profile URL
              </label>
              <input
                type="url"
                value={formData.codeforces}
                onChange={(e) => handleChange('codeforces', e.target.value)}
                className="w-full bg-[#141414] dark:bg-[#141414] light:bg-slate-100 border border-white/15 text-xs rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 dark:text-neutral-300 light:text-slate-700 mb-1.5">
                CodeChef Profile URL
              </label>
              <input
                type="url"
                value={formData.codechef}
                onChange={(e) => handleChange('codechef', e.target.value)}
                className="w-full bg-[#141414] dark:bg-[#141414] light:bg-slate-100 border border-white/15 text-xs rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 dark:text-neutral-300 light:text-slate-700 mb-1.5">
                HackerRank Profile URL
              </label>
              <input
                type="url"
                value={formData.hackerrank}
                onChange={(e) => handleChange('hackerrank', e.target.value)}
                className="w-full bg-[#141414] dark:bg-[#141414] light:bg-slate-100 border border-white/15 text-xs rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 dark:text-neutral-300 light:text-slate-700 mb-1.5">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                value={formData.linkedin}
                onChange={(e) => handleChange('linkedin', e.target.value)}
                className="w-full bg-[#141414] dark:bg-[#141414] light:bg-slate-100 border border-white/15 text-xs rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon={Save}
              className="bg-white text-black font-bold hover:bg-neutral-200 shadow-xl border border-white/20 text-xs sm:text-sm px-6 py-3"
            >
              Save Profile Settings
            </Button>
          </div>
        </div>
      </form>

      {/* Public Profile Preview Modal */}
      <AnimatePresence>
        {showPublicPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPublicPreview(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-[#0A0A0A] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-6 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Verified Candidate Public Portfolio Showcase
                </span>
                <button onClick={() => setShowPublicPreview(false)} className="p-1 text-neutral-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left bg-[#141414] p-5 rounded-2xl border border-white/10">
                  <img
                    src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover ring-2 ring-emerald-400/40 shrink-0"
                  />
                  <div className="space-y-1">
                    <h2 className="text-xl font-extrabold text-white">{formData.name}</h2>
                    <p className="text-xs text-emerald-400 font-mono font-semibold">{formData.role}</p>
                    <p className="text-xs text-neutral-400">{formData.location} • {formData.email}</p>
                    <p className="text-[11px] text-cyan-400 font-mono">Target: {formData.targetPosition}</p>
                  </div>
                </div>

                {/* Professional Bio & Education */}
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold uppercase text-neutral-400">Professional Bio & Background</span>
                  <p className="text-xs text-neutral-200 leading-relaxed bg-[#141414] p-4 rounded-2xl border border-white/10 font-sans">
                    "{formData.bio}"
                  </p>
                  <p className="text-xs font-mono text-neutral-400 pt-1">
                    🎓 Education: <span className="text-white">{formData.education}</span>
                  </p>
                </div>

                {/* Verified Technical Skills */}
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold uppercase text-neutral-400">Verified Technical Skill Set</span>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.split(',').map((sk, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-xl bg-[#141414] border border-white/15 text-xs text-emerald-400 font-mono font-semibold">
                        {sk.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Connected Coding & Social Platforms */}
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold uppercase text-neutral-400">Connected Coding Profiles & Socials</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                    {formData.github && (
                      <a href={formData.github} target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-[#141414] border border-white/10 hover:border-white/30 text-neutral-200 flex items-center gap-2 truncate">
                        <Github className="w-4 h-4 text-emerald-400 shrink-0" /> GitHub
                      </a>
                    )}
                    {formData.leetcode && (
                      <a href={formData.leetcode} target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-[#141414] border border-white/10 hover:border-white/30 text-amber-400 flex items-center gap-2 truncate">
                        <Code2 className="w-4 h-4 text-amber-400 shrink-0" /> LeetCode
                      </a>
                    )}
                    {formData.codeforces && (
                      <a href={formData.codeforces} target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-[#141414] border border-white/10 hover:border-white/30 text-cyan-400 flex items-center gap-2 truncate">
                        <Globe className="w-4 h-4 text-cyan-400 shrink-0" /> Codeforces
                      </a>
                    )}
                    {formData.hackerrank && (
                      <a href={formData.hackerrank} target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-[#141414] border border-white/10 hover:border-white/30 text-emerald-400 flex items-center gap-2 truncate">
                        <Award className="w-4 h-4 text-emerald-400 shrink-0" /> HackerRank
                      </a>
                    )}
                    {formData.linkedin && (
                      <a href={formData.linkedin} target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-[#141414] border border-white/10 hover:border-white/30 text-blue-400 flex items-center gap-2 truncate">
                        <Linkedin className="w-4 h-4 text-blue-400 shrink-0" /> LinkedIn
                      </a>
                    )}
                  </div>
                </div>

                {/* AI Competency Scorecard Stats */}
                <div className="p-5 rounded-2xl bg-[#141414] border border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase">AI Score</span>
                    <div className="text-xl font-extrabold text-emerald-400">92.4%</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase">Mock Loops</span>
                    <div className="text-xl font-extrabold text-white">18 Sessions</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase">ATS Match</span>
                    <div className="text-xl font-extrabold text-cyan-400">94% Optimal</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase">Practice Streak</span>
                    <div className="text-xl font-extrabold text-amber-400">5 Days 🔥</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowPublicPreview(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#141414] hover:bg-[#222222] text-neutral-200 text-xs font-mono font-semibold border border-white/15"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Profile;
