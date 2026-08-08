import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, Target, GraduationCap, CheckCircle2, Lock, Sparkles,
  Download, Share2, ExternalLink, Check, ShieldCheck, Cpu,
  Layers, MessageSquare, Radio, Star, Zap, Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/apiClient';

const MILESTONES = [
  {
    id: 'm1',
    title: 'Distributed System Architecture',
    desc: 'Demonstrate latency vs throughput trade-offs in 5 mock interview loops.',
    current: 5,
    target: 5,
    status: 'Claimable'
  },
  {
    id: 'm2',
    title: 'Acoustic Clarity & Vocal Control',
    desc: 'Maintain under 0.5 filler words per minute across 3 consecutive sessions.',
    current: 2,
    target: 3,
    status: 'In Progress'
  },
  {
    id: 'm3',
    title: 'ATS Resume Match Optimization',
    desc: 'Achieve a 90%+ ATS structural role match score on resume upload.',
    current: 1,
    target: 1,
    status: 'Completed'
  },
  {
    id: 'm4',
    title: 'STAR Method Leadership Delivery',
    desc: 'Deliver 4 STAR-structured behavioral answers with high confidence.',
    current: 4,
    target: 4,
    status: 'Completed'
  },
  {
    id: 'm5',
    title: 'Database Indexing & Rate Limiting',
    desc: 'Formulate query optimization and rate limiting strategies in technical loop.',
    current: 1,
    target: 2,
    status: 'In Progress'
  }
];

const BADGES = [
  {
    id: 'b1',
    title: 'Distributed Systems Architect',
    desc: 'Mastered distributed caching, CAP theorem, and rate limiting.',
    icon: Cpu,
    category: 'Architecture',
    unlocked: true,
    date: 'July 2026'
  },
  {
    id: 'b2',
    title: 'Virtual DOM & Reconciliation',
    desc: 'Scored 95%+ accuracy on React Fiber diffing algorithms.',
    icon: Layers,
    category: 'Frontend',
    unlocked: true,
    date: 'July 2026'
  },
  {
    id: 'b3',
    title: 'STAR Method Leadership',
    desc: 'Demonstrated structured executive presence in behavioral questions.',
    icon: ShieldCheck,
    category: 'Behavioral',
    unlocked: true,
    date: 'July 2026'
  },
  {
    id: 'b4',
    title: 'Vocal Clarity & Zero Filler',
    desc: 'Recorded 0 filler words across a full 20-minute session.',
    icon: Radio,
    category: 'Acoustics',
    unlocked: true,
    date: 'July 2026'
  },
  {
    id: 'b5',
    title: 'Vision Gaze Alignment',
    desc: 'Maintained 95%+ eye contact alignment during live webcam feed.',
    icon: Activity,
    category: 'Analytics',
    unlocked: true,
    date: 'July 2026'
  },
  {
    id: 'b6',
    title: 'ATS Resume Benchmark',
    desc: 'Achieved 94%+ match rating on targeted role resume scan.',
    icon: Star,
    category: 'Resume',
    unlocked: true,
    date: 'July 2026'
  },
  {
    id: 'b7',
    title: 'High-Scale Systems Titan',
    desc: 'Complete 10 System Design mock loops with >90% score.',
    icon: Award,
    category: 'Architecture',
    unlocked: false,
    progress: '6 / 10 Completed'
  },
  {
    id: 'b8',
    title: 'State Management Architect',
    desc: 'Explain normalized state stores and memoization techniques.',
    icon: Zap,
    category: 'Frontend',
    unlocked: true,
    date: 'July 2026'
  }
];

const CERTIFICATIONS = [
  {
    id: 'c1',
    title: 'Verified Staff Systems Architect',
    specialization: 'Distributed Systems & Database Optimization',
    issuer: 'InterviewIQ Standards Board',
    score: '94.8%',
    issueDate: 'July 2026',
    hash: '0x8F9A7B3C2D1E4F5A6B7C8D9E0F1A2B3C',
    status: 'Verified'
  },
  {
    id: 'c2',
    title: 'Principal Behavioral Leadership Credential',
    specialization: 'STAR Method & Executive Communication',
    issuer: 'InterviewIQ Leadership Council',
    score: '96.2%',
    issueDate: 'July 2026',
    hash: '0x3B2E1F0A9D8C7B6A5F4E3D2C1B0A9F8E',
    status: 'Verified'
  }
];

export const Achievements = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('milestones');
  const [claimed, setClaimed] = useState(['m3', 'm4']);
  const [selectedCert, setSelectedCert] = useState(null);
  const [apiData, setApiData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchAchievements = async () => {
      try {
        const res = await apiClient.get('/achievements');
        if (isMounted && res.data) {
          setApiData(res.data);
        }
      } catch (err) {
        console.warn('Achievements fetch notice (local mode):', err);
      }
    };
    fetchAchievements();
    return () => { isMounted = false; };
  }, []);

  const handleClaim = (id) => {
    if (!claimed.includes(id)) {
      setClaim(prev => [...prev, id]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto font-sans"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Achievements & Credentials
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Track your interview milestones, earned skill badges, and verified credentials.
          </p>
        </div>

        {/* Simplified Tabs */}
        <div className="flex items-center bg-[#0A0A0A] border border-white/15 p-1 rounded-xl font-mono text-xs shadow-lg">
          {[
            { id: 'milestones', label: 'Milestones', icon: Target },
            { id: 'badges', label: 'Skill Badges', icon: Award },
            { id: 'certificates', label: 'Certifications', icon: GraduationCap },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Clean Overview Card */}
      <div className="surface-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">{user?.name || 'Alex Rivera'}</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
              {user?.role || 'Full-Stack Candidate'}
            </span>
          </div>
          <p className="text-xs text-neutral-400 font-mono mt-1">
            Overall AI Readiness: <strong className="text-white">{apiData?.avgScore || 92.4}%</strong> • {apiData?.totalSessions || 4} Practice Sessions Completed
          </p>
        </div>

        {/* 3 Simple Stats */}
        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="surface-control px-4 py-2.5 text-center">
            <span className="text-[10px] text-neutral-400 uppercase block">Milestones</span>
            <span className="text-sm font-bold text-white">4 / 5</span>
          </div>
          <div className="surface-control px-4 py-2.5 text-center">
            <span className="text-[10px] text-neutral-400 uppercase block">Badges</span>
            <span className="text-sm font-bold text-emerald-400">7 / 8</span>
          </div>
          <div className="surface-control px-4 py-2.5 text-center">
            <span className="text-[10px] text-neutral-400 uppercase block">Certificates</span>
            <span className="text-sm font-bold text-cyan-400">2 Verified</span>
          </div>
        </div>
      </div>

      {/* TAB 1: MILESTONES */}
      {activeTab === 'milestones' && (
        <div className="space-y-3">
          {MILESTONES.map((m) => {
            const isDone = claimed.includes(m.id) || m.status === 'Completed';
            const isReady = m.status === 'Claimable' && !isDone;

            return (
              <div
                key={m.id}
                className="surface-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    isDone
                      ? 'bg-[#141414] border-white/20 text-emerald-400'
                      : 'bg-black border-white/10 text-neutral-400'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{m.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                        isDone
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : isReady
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-[#141414] text-neutral-400 border border-white/10'
                      }`}>
                        {isDone ? 'Completed ✓' : m.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">{m.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center font-mono text-xs">
                  {isReady ? (
                    <button
                      onClick={() => handleClaim(m.id)}
                      className="px-4 py-2 rounded-lg bg-white text-black font-bold hover:bg-neutral-200 transition-all text-xs flex items-center gap-1.5 shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Claim Completion
                    </button>
                  ) : isDone ? (
                    <span className="text-neutral-400 font-semibold flex items-center gap-1 text-xs">
                      <Check className="w-4 h-4 text-emerald-400" /> Done
                    </span>
                  ) : (
                    <span className="text-neutral-400 text-xs">
                      Progress: <strong className="text-white">{m.current}/{m.target}</strong>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: SKILL BADGES */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BADGES.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.id}
                className={`surface-card p-4 space-y-3 flex flex-col justify-between transition-all ${
                  b.unlocked ? 'hover:border-white/30' : 'opacity-50'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      b.unlocked
                        ? 'bg-[#141414] border-white/20 text-emerald-400'
                        : 'bg-black border-white/10 text-neutral-600'
                    }`}>
                      {b.unlocked ? <Icon className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    </div>

                    <span className="text-[10px] font-mono text-neutral-400 bg-[#141414] px-2 py-0.5 rounded border border-white/10">
                      {b.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white">{b.title}</h3>
                    <p className="text-xs text-neutral-400 leading-relaxed mt-1">{b.desc}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 text-[10px] font-mono text-neutral-400 flex items-center justify-between">
                  {b.unlocked ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {b.date}
                    </span>
                  ) : (
                    <span>{b.progress}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: CERTIFICATIONS */}
      {activeTab === 'certificates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CERTIFICATIONS.map((cert) => (
            <div
              key={cert.id}
              className="surface-card p-6 space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#141414] border border-white/20 text-amber-400 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    {cert.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{cert.title}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">{cert.specialization}</p>
                </div>

                <div className="surface-control p-3 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Issuer:</span>
                    <span className="text-white font-semibold">{cert.issuer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Evaluated Score:</span>
                    <span className="text-emerald-400 font-bold">{cert.score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Issue Date:</span>
                    <span className="text-neutral-300">{cert.issueDate}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => setSelectedCert(cert)}
                  className="flex-1 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <ExternalLink className="w-4 h-4 text-black" /> View Certificate
                </button>
                <button
                  onClick={() => alert(`Certificate ${cert.id} PDF download initiated.`)}
                  className="p-2.5 rounded-xl surface-control text-neutral-200 hover:text-white border border-white/10"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CERTIFICATE MODAL */}
      <AnimatePresence>
        {selectedCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCert(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/20 rounded-2xl p-6 space-y-5 shadow-2xl z-10 font-sans text-white"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" /> Official Credential
                </div>
                <button
                  onClick={() => setSelectedCert(null)}
                  className="text-neutral-400 hover:text-white text-sm font-mono"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 rounded-xl bg-[#121212] border border-white/10 space-y-4 text-center font-mono text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">CERTIFICATE OF COMPETENCY</span>
                  <h3 className="text-base font-bold text-white font-sans">{selectedCert.title}</h3>
                  <p className="text-xs text-neutral-400">{selectedCert.specialization}</p>
                </div>

                <div className="py-3 border-y border-white/10 flex items-center justify-between">
                  <span>Candidate: <strong className="text-white">Alex Rivera</strong></span>
                  <span>Score: <strong className="text-emerald-400">{selectedCert.score}</strong></span>
                </div>

                <div className="text-[10px] text-neutral-400 text-left truncate">
                  Verification Hash: <span className="text-cyan-400">{selectedCert.hash}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 font-mono text-xs">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://interviewiq.ai/verify/${selectedCert.hash}`);
                    alert('Verification link copied!');
                  }}
                  className="px-4 py-2 rounded-xl surface-control text-neutral-200 hover:text-white border border-white/10 font-semibold flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" /> Share Link
                </button>

                <button
                  onClick={() => alert('PDF Export started.')}
                  className="px-4 py-2 rounded-xl bg-white text-black font-bold hover:bg-neutral-200 transition-all flex items-center gap-1.5 shadow-md"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Achievements;
