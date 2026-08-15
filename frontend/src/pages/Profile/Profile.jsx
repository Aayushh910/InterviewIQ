import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Github, Linkedin, Globe, Code2, Award, Share2, Eye, X, Save, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { apiClient } from '../../services/apiClient';

export const Profile = () => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'Software Candidate',
    targetPosition: '',
    bio: '',
    location: '',
    skills: '',
    education: '',
    github: '',
    leetcode: '',
    codeforces: '',
    codechef: '',
    hackerrank: '',
    linkedin: '',
    website: '',
  });

  const [savedToast, setSavedToast] = useState(false);
  const [showPublicPreview, setShowPublicPreview] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        role: user.role || prev.role,
      }));
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/profile');
        if (isMounted && res.data) {
          setFormData((prev) => ({
            ...prev,
            name: res.data.name || prev.name,
            email: res.data.email || prev.email,
            role: res.data.role || prev.role,
            targetPosition: res.data.target_position || prev.targetPosition,
            bio: res.data.bio || prev.bio,
            location: res.data.location || prev.location,
            skills: res.data.skills || prev.skills,
            education: res.data.education || prev.education,
            github: res.data.github || prev.github,
            leetcode: res.data.leetcode || prev.leetcode,
            codeforces: res.data.codeforces || prev.codeforces,
            codechef: res.data.codechef || prev.codechef,
            hackerrank: res.data.hackerrank || prev.hackerrank,
            linkedin: res.data.linkedin || prev.linkedin,
            website: res.data.website || prev.website,
          }));
        }
      } catch (err) {
        console.warn('Profile fetch notice:', err);
      }
    };
    fetchProfile();
    return () => { isMounted = false; };
  }, []);

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put('/profile', {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        target_position: formData.targetPosition,
        bio: formData.bio,
        location: formData.location,
        skills: formData.skills,
        education: formData.education,
        github: formData.github,
        leetcode: formData.leetcode,
        codeforces: formData.codeforces,
        codechef: formData.codechef,
        hackerrank: formData.hackerrank,
        linkedin: formData.linkedin,
        website: formData.website,
      });
    } catch (err) {
      console.warn('Profile update notice:', err);
    }

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
            Professional Profile & Settings
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Manage your personal bio, target role, technical skills, and connected platform profiles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPublicPreview(true)}
            className="px-4 py-2.5 rounded-xl bg-[#141414] hover:bg-[#1f1f1f] text-neutral-200 text-xs font-mono font-semibold flex items-center gap-2 border border-white/15 transition-colors"
          >
            <Eye className="w-4 h-4 text-cyan-400" /> Profile Preview
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Profile link copied to clipboard!');
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
            <div className="w-20 h-20 rounded-full bg-[#1A1A1A] border border-white/20 flex items-center justify-center text-emerald-400 text-2xl font-bold font-mono shrink-0">
              {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-white dark:text-white light:text-slate-900">{formData.name || 'Candidate Account'}</h3>
              <p className="text-xs text-emerald-400 font-mono">{formData.role}</p>
              <p className="text-xs text-neutral-400">{formData.email}</p>
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
                placeholder="Enter your full name"
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
                placeholder="your.email@example.com"
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
                placeholder="e.g. Senior Full-Stack Candidate"
                className="w-full bg-[#141414] dark:bg-[#141414] light:bg-slate-100 border border-white/15 text-xs rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 dark:text-neutral-300 light:text-slate-700 mb-1.5">
                Target Position
              </label>
              <input
                type="text"
                value={formData.targetPosition}
                onChange={(e) => handleChange('targetPosition', e.target.value)}
                placeholder="e.g. Staff Frontend Engineer"
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
              placeholder="Tell us about your background and technical strengths..."
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
                placeholder="React, TypeScript, Python, PostgreSQL"
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
                placeholder="B.S. in Computer Science"
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
                placeholder="https://github.com/username"
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
                placeholder="https://leetcode.com/u/username"
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
                placeholder="https://linkedin.com/in/username"
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
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Candidate Profile Preview
                </span>
                <button onClick={() => setShowPublicPreview(false)} className="p-1 text-neutral-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left bg-[#141414] p-5 rounded-2xl border border-white/10">
                  <div className="w-20 h-20 rounded-full bg-[#1A1A1A] border border-white/20 flex items-center justify-center text-emerald-400 text-2xl font-bold font-mono shrink-0">
                    {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-extrabold text-white">{formData.name || 'Candidate Account'}</h2>
                    <p className="text-xs text-emerald-400 font-mono font-semibold">{formData.role}</p>
                    <p className="text-xs text-neutral-400">{formData.email}</p>
                    {formData.targetPosition && (
                      <p className="text-[11px] text-cyan-400 font-mono">Target: {formData.targetPosition}</p>
                    )}
                  </div>
                </div>

                {formData.bio && (
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold uppercase text-neutral-400">Professional Bio</span>
                    <p className="text-xs text-neutral-200 leading-relaxed bg-[#141414] p-4 rounded-2xl border border-white/10 font-sans">
                      "{formData.bio}"
                    </p>
                  </div>
                )}

                {formData.skills && (
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold uppercase text-neutral-400">Skills</span>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.split(',').map((sk, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-xl border border-white/15 bg-[#141414] text-xs font-mono text-cyan-400">
                          {sk.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
