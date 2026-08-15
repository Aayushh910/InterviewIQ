import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Award, Target, GraduationCap, CheckCircle2, Lock, Sparkles,
  Download, Share2, ExternalLink, Check, ShieldCheck, Cpu,
  Layers, Star, Zap, Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useInterview } from '../../context/InterviewContext';
import { Link } from 'react-router-dom';

export const Achievements = () => {
  const { user } = useAuth();
  const { interviews } = useInterview();
  const [activeTab, setActiveTab] = useState('milestones');

  const totalSessions = interviews.length;
  const evaluated = interviews.filter(i => i.score !== undefined && i.score !== null && Number(i.score) > 0);
  const avgScore = evaluated.length > 0
    ? (evaluated.reduce((acc, curr) => acc + Number(curr.score), 0) / evaluated.length).toFixed(1)
    : 'N/A';

  const MILESTONES = [
    {
      id: 'm1',
      title: 'First AI Mock Loop Completed',
      desc: 'Complete your first practice session with voice audio & facial analysis.',
      current: Math.min(totalSessions, 1),
      target: 1,
      status: totalSessions >= 1 ? 'Completed' : 'In Progress'
    },
    {
      id: 'm2',
      title: 'STAR Response Mastery',
      desc: 'Deliver 3 structured technical or behavioral answers.',
      current: Math.min(totalSessions, 3),
      target: 3,
      status: totalSessions >= 3 ? 'Completed' : 'In Progress'
    },
    {
      id: 'm3',
      title: 'High Competency AI Readiness',
      desc: 'Achieve an overall AI evaluation score of 80%+ on an interview session.',
      current: evaluated.some(i => Number(i.score) >= 80) ? 1 : 0,
      target: 1,
      status: evaluated.some(i => Number(i.score) >= 80) ? 'Completed' : 'In Progress'
    }
  ];

  const BADGES = [
    {
      id: 'b1',
      title: 'First Practice Session',
      desc: 'Recorded and evaluated first mock interview loop.',
      icon: Cpu,
      category: 'Foundation',
      unlocked: totalSessions >= 1,
      date: totalSessions >= 1 ? 'Unlocked' : 'Locked'
    },
    {
      id: 'b2',
      title: 'Voice & Speech Articulation',
      desc: 'Submitted spoken audio response for Whisper STT transcription.',
      icon: Activity,
      category: 'Acoustics',
      unlocked: totalSessions >= 1,
      date: totalSessions >= 1 ? 'Unlocked' : 'Locked'
    },
    {
      id: 'b3',
      title: 'Facial Composure Alignment',
      desc: 'Attached live webcam frame analysis to answer evaluation.',
      icon: ShieldCheck,
      category: 'Analytics',
      unlocked: totalSessions >= 1,
      date: totalSessions >= 1 ? 'Unlocked' : 'Locked'
    },
    {
      id: 'b4',
      title: 'High Competency Benchmark',
      desc: 'Scored 80%+ on overall interview performance evaluation.',
      icon: Star,
      category: 'Evaluation',
      unlocked: evaluated.some(i => Number(i.score) >= 80),
      date: evaluated.some(i => Number(i.score) >= 80) ? 'Unlocked' : 'Locked'
    }
  ];

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

        {/* Tabs */}
        <div className="flex items-center bg-[#0A0A0A] border border-white/15 p-1 rounded-xl font-mono text-xs shadow-lg">
          {[
            { id: 'milestones', label: 'Milestones', icon: Target },
            { id: 'badges', label: 'Skill Badges', icon: Award },
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

      {/* Overview Card */}
      <div className="surface-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">{user?.name || 'Candidate Account'}</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
              {user?.role || 'Software Candidate'}
            </span>
          </div>
          <p className="text-xs text-neutral-400 font-mono mt-1">
            Overall AI Score: <strong className="text-white">{avgScore !== 'N/A' ? `${avgScore}%` : 'N/A'}</strong> • {totalSessions} Practice Sessions Completed
          </p>
        </div>

        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="surface-control px-4 py-2.5 text-center">
            <span className="text-[10px] text-neutral-400 uppercase block">Milestones</span>
            <span className="text-sm font-bold text-white">{MILESTONES.filter(m => m.status === 'Completed').length} / {MILESTONES.length}</span>
          </div>
          <div className="surface-control px-4 py-2.5 text-center">
            <span className="text-[10px] text-neutral-400 uppercase block">Badges</span>
            <span className="text-sm font-bold text-emerald-400">{BADGES.filter(b => b.unlocked).length} / {BADGES.length}</span>
          </div>
        </div>
      </div>

      {totalSessions === 0 && (
        <div className="surface-card p-8 text-center space-y-3">
          <Award className="w-10 h-10 text-neutral-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Achievements Unlocked Yet</h3>
          <p className="text-xs text-neutral-400 font-mono max-w-sm mx-auto">
            Complete your first AI mock interview session to unlock skill badges, track milestones, and earn candidate credentials.
          </p>
          <div className="pt-2">
            <Link
              to="/interview"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black font-bold font-mono text-xs hover:bg-neutral-200 transition-colors shadow-lg"
            >
              Start Practice Interview
            </Link>
          </div>
        </div>
      )}

      {/* TAB 1: MILESTONES */}
      {activeTab === 'milestones' && (
        <div className="space-y-3">
          {MILESTONES.map((m) => {
            const isDone = m.status === 'Completed';

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
                          : 'bg-[#141414] text-neutral-400 border border-white/10'
                      }`}>
                        {isDone ? 'Completed ✓' : 'In Progress'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">{m.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center font-mono text-xs">
                  <span className="text-neutral-400 text-xs">
                    Progress: <strong className="text-white">{m.current}/{m.target}</strong>
                  </span>
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
                      <CheckCircle2 className="w-3 h-3" /> Unlocked
                    </span>
                  ) : (
                    <span>Locked</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default Achievements;
