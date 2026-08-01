import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Award, Zap, Shield, Flame, CheckCircle2, Lock, Trophy, Star,
  GraduationCap, Users, Target, Crosshair, Sparkles, Sword, Crown, Check
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

const QUESTS = [
  { id: 'q1', title: 'Flawless System Trade-offs', desc: 'State latency vs throughput trade-offs in 5 Technical Mock loops.', current: 3, target: 5, rewardXp: 500, status: 'In Progress' },
  { id: 'q2', title: 'Zero Filler Oracle', desc: 'Maintain under 0.5 filler words/min across 3 consecutive sessions.', current: 2, target: 3, rewardXp: 350, status: 'In Progress' },
  { id: 'q3', title: 'ATS Resume Overclock', desc: 'Upload a target resume scoring 90%+ ATS role compatibility.', current: 1, target: 1, rewardXp: 600, status: 'Claimable' },
  { id: 'q4', title: 'Behavioral STAR Warlord', desc: 'Deliver 4 STAR-structured behavioral answers with high confidence.', current: 4, target: 4, rewardXp: 750, status: 'Completed' },
  { id: 'q5', title: 'Night Owl Speed Drill', desc: 'Complete a 30-minute timed mock interview session after 9:00 PM.', current: 0, target: 1, rewardXp: 400, status: 'Locked' },
];

const ACHIEVEMENTS_GRID = [
  { id: 'b1', title: 'First Interview', desc: 'Completed your very first AI mock interview simulation.', icon: Zap, rarity: 'Common', xp: '+100 XP', unlocked: true, date: 'Unlocked July 18' },
  { id: 'b2', title: '10 Interviews Master', desc: 'Completed 10 full AI technical mock sessions.', icon: Award, rarity: 'Rare', xp: '+400 XP', unlocked: true, date: 'Unlocked July 24' },
  { id: 'b3', title: 'Virtual DOM Whisperer', desc: 'Scored 95%+ depth on React Fiber reconciliation questions.', icon: Sparkles, rarity: 'Epic', xp: '+750 XP', unlocked: true, date: 'Unlocked July 26' },
  { id: 'b4', title: '7-Day Flame Legend', desc: 'Maintained a 7-day consecutive practice streak.', icon: Flame, rarity: 'Legendary', xp: '+1200 XP', unlocked: true, date: 'Unlocked July 28' },
  { id: 'b5', title: 'Zero Filler Oracle', desc: 'Recorded 0 filler words in a full 20-minute session.', icon: Shield, rarity: 'Legendary', xp: '+1000 XP', unlocked: true, date: 'Unlocked July 29' },
  { id: 'b6', title: 'ATS Overclock 95%', desc: 'Uploaded a resume achieving 94%+ ATS match score.', icon: Star, rarity: 'Rare', xp: '+500 XP', unlocked: true, date: 'Unlocked July 20' },
  { id: 'b7', title: 'STAR Method Warlord', desc: 'Mastered Situation-Task-Action-Result structure.', icon: Sword, rarity: 'Epic', xp: '+800 XP', unlocked: true, date: 'Unlocked July 25' },
  { id: 'b8', title: 'Eye Contact Sentinel', desc: 'Maintained 95%+ vision gaze alignment in live webcam feed.', icon: Crosshair, rarity: 'Rare', xp: '+450 XP', unlocked: true, date: 'Unlocked July 27' },
  { id: 'b9', title: '50 Interviews Legend', desc: 'Complete 50 technical & behavioral mock loops.', icon: Trophy, rarity: 'Mythic', xp: '+2500 XP', unlocked: false, progress: '18 / 50' },
  { id: 'b10', title: 'Microservice Titan', desc: 'Explain rate limiting and database indexing flawlessly.', icon: Shield, rarity: 'Epic', xp: '+900 XP', unlocked: false, progress: '2 / 3' },
  { id: 'b11', title: 'Speed Demon Drill', desc: 'Finish 5 questions in under 15 minutes with >85% score.', icon: Zap, rarity: 'Rare', xp: '+500 XP', unlocked: false, progress: '1 / 2' },
  { id: 'b12', title: 'Offer Collector', desc: 'Achieve overall AI Readiness score of 95%+ on 5 interviews.', icon: Crown, rarity: 'Mythic', xp: '+3000 XP', unlocked: false, progress: '3 / 5' },
];

const LEADERBOARD = [
  { rank: 1, name: 'Elena Rostova', title: 'System Archmage', xp: '14,250 XP', score: '96.8%', streak: '14 Days 🔥', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', badge: '🥇 Gold' },
  { rank: 2, name: 'Alex Rivera (You)', title: 'Technical Overlord', xp: '8,450 XP', score: '92.4%', streak: '5 Days 🔥', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', badge: '🥈 Silver' },
  { rank: 3, name: 'David Chen', title: 'Backend Sentinel', xp: '7,900 XP', score: '91.2%', streak: '9 Days 🔥', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', badge: '🥉 Bronze' },
  { rank: 4, name: 'Sarah Jenkins', title: 'Principal Titan', xp: '6,850 XP', score: '90.5%', streak: '4 Days 🔥', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80', badge: '#4 Rank' },
];

export const Achievements = () => {
  const [activeTab, setActiveTab] = useState('missions'); // 'missions' | 'badges' | 'certificates' | 'leaderboard'
  const [claimedQuests, setClaimedQuests] = useState(['q4']);

  const handleClaim = (questId) => {
    if (!claimedQuests.includes(questId)) {
      setClaimedQuests((prev) => [...prev, questId]);
    }
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-white/20 text-amber-400 text-xs font-mono font-semibold mb-2 shadow-sm">
            <Trophy className="w-3.5 h-3.5" /> Gamification & Live Mission HUD
          </div>
          <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
            Gaming Mission Tracing & Achievements
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Trace live active quests, level up your candidate rank, unlock unique skill badges, and dominate the global leaderboard.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap rounded-2xl bg-[#0A0A0A] border border-white/15 p-1 self-start sm:self-auto font-mono text-xs">
          <button
            onClick={() => setActiveTab('missions')}
            className={`px-3.5 py-2 font-bold rounded-xl transition-all ${
              activeTab === 'missions' ? 'bg-white text-black shadow-lg' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Live Missions
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-3.5 py-2 font-bold rounded-xl transition-all ${
              activeTab === 'badges' ? 'bg-white text-black shadow-lg' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Badges Locker ({ACHIEVEMENTS_GRID.filter(b => b.unlocked).length}/{ACHIEVEMENTS_GRID.length})
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-3.5 py-2 font-bold rounded-xl transition-all ${
              activeTab === 'certificates' ? 'bg-white text-black shadow-lg' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Certificates
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3.5 py-2 font-bold rounded-xl transition-all ${
              activeTab === 'leaderboard' ? 'bg-white text-black shadow-lg' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Leaderboard
          </button>
        </div>
      </div>

      {/* GAMIFIED HERO HUD BAR */}
      <div className="rounded-3xl bg-[#0A0A0A]/95 border border-white/15 p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-white/20 flex flex-col items-center justify-center text-amber-400 shrink-0 shadow-lg font-mono">
              <Crown className="w-7 h-7" />
              <span className="text-[10px] font-extrabold text-white uppercase">LVL 14</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">Alex Rivera</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#141414] border border-white/20 text-emerald-400 text-xs font-mono font-bold">
                  Technical Overlord
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Current Level 14 Candidate • 8,450 / 10,000 XP to Level 15
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 font-mono text-xs">
            <div className="p-3 rounded-2xl bg-[#141414] border border-white/15 text-center shrink-0">
              <span className="text-[10px] text-neutral-400 uppercase block">Streak Multiplier</span>
              <span className="text-sm font-extrabold text-amber-400 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 text-orange-500 fill-current" /> 5-Day Flame (2.5x XP)
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#141414] border border-white/15 text-center shrink-0">
              <span className="text-[10px] text-neutral-400 uppercase block">Global Rank</span>
              <span className="text-sm font-extrabold text-cyan-400">#2 Worldwide</span>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-400">XP Progress to Level 15 (84.5%)</span>
            <span className="text-emerald-400 font-bold">8,450 / 10,000 XP</span>
          </div>
          <div className="w-full bg-[#141414] border border-white/10 rounded-full h-3 overflow-hidden p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '84.5%' }}
              transition={{ duration: 1 }}
              className="h-full bg-emerald-400 rounded-full shadow-sm shadow-emerald-400/50"
            />
          </div>
        </div>
      </div>

      {/* Tab 1: Live Missions & Quest Tracing */}
      {activeTab === 'missions' && (
        <div className="space-y-4">
          <div className="px-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" /> Active Quests & Real-Time Mission Tracing
            </h2>
            <p className="text-xs text-neutral-400">Complete live mock interview objectives to earn instant XP boosts and unique badges</p>
          </div>

          <div className="space-y-3">
            {QUESTS.map((q) => {
              const isClaimed = claimedQuests.includes(q.id);
              const isReadyToClaim = q.status === 'Claimable' || (q.current === q.target && !isClaimed);

              return (
                <div
                  key={q.id}
                  className="p-5 rounded-3xl bg-[#0A0A0A]/90 border border-white/15 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono hover:border-white/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isClaimed || q.status === 'Completed'
                        ? 'bg-[#141414] border-white/20 text-emerald-400'
                        : isReadyToClaim
                        ? 'bg-[#141414] border-emerald-500/50 text-emerald-400 animate-pulse'
                        : 'bg-black border-white/10 text-neutral-500'
                    }`}>
                      <Crosshair className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white font-sans">{q.title}</h3>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${
                          isClaimed || q.status === 'Completed'
                            ? 'bg-[#141414] border-white/20 text-neutral-400'
                            : isReadyToClaim
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                            : 'bg-[#141414] border-white/15 text-cyan-400'
                        }`}>
                          {isClaimed ? 'Claimed ✓' : q.status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 font-sans">{q.desc}</p>
                      
                      {/* Quest mini progress */}
                      <div className="flex items-center gap-3 pt-1 text-[11px]">
                        <span className="text-neutral-400">Progress: <strong className="text-white">{q.current} / {q.target}</strong></span>
                        <span className="text-amber-400 font-bold">Reward: +{q.rewardXp} XP</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    {isReadyToClaim && !isClaimed ? (
                      <button
                        onClick={() => handleClaim(q.id)}
                        className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all shadow-lg border border-white/20 flex items-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-600" /> Claim +{q.rewardXp} XP
                      </button>
                    ) : isClaimed ? (
                      <span className="px-4 py-2 rounded-xl bg-[#141414] border border-white/15 text-neutral-400 text-xs font-bold flex items-center gap-1">
                        <Check className="w-4 h-4 text-emerald-400" /> Claimed
                      </span>
                    ) : (
                      <div className="w-32 bg-[#141414] border border-white/10 rounded-full h-2 overflow-hidden">
                        <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${(q.current / q.target) * 100}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: 12 Unique Achievements Locker */}
      {activeTab === 'badges' && (
        <div className="space-y-4">
          <div className="px-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" /> Unique Candidate Badges & Trophy Locker
            </h2>
            <p className="text-xs text-neutral-400">Collect 12 unique skill badges by mastering Virtual DOM, STAR framing, and zero filler drills</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ACHIEVEMENTS_GRID.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.id}
                  className={`p-6 rounded-3xl border transition-all flex items-start gap-4 backdrop-blur-xl ${
                    b.unlocked
                      ? 'bg-[#0A0A0A]/90 border-white/15 shadow-2xl hover:border-white/30 hover:bg-[#141414]'
                      : 'bg-[#141414]/40 border-white/10 opacity-60'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    b.unlocked
                      ? 'bg-[#141414] border border-white/20 text-amber-400 shadow-md'
                      : 'bg-black border border-white/10 text-neutral-600'
                  }`}>
                    {b.unlocked ? <Icon className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">{b.title}</h3>
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-[#141414] px-2 py-0.5 rounded-full border border-white/15">
                        {b.rarity}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">{b.desc}</p>

                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-2 border-t border-white/10 mt-2">
                      <span className="text-emerald-400 font-bold">{b.xp}</span>
                      <span>{b.unlocked ? b.date : `Progress: ${b.progress}`}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Official Verification Certificates */}
      {activeTab === 'certificates' && (
        <div className="rounded-3xl bg-[#0A0A0A]/90 border border-white/15 p-8 shadow-2xl backdrop-blur-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-white/15 text-amber-400 mx-auto flex items-center justify-center shadow-md">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-bold text-white">
              Official InterviewIQ Certification
            </h2>
            <p className="text-xs text-neutral-400">
              Complete 20 technical mock sessions with 90%+ average score to unlock your Verified Staff Engineer Competency Certificate.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#141414] border border-white/15 max-w-xl mx-auto text-left space-y-3 font-mono text-xs shadow-xl">
            <div className="text-amber-400 font-bold text-sm border-b border-white/10 pb-2 flex justify-between items-center">
              <span>CERTIFICATE OF EXCELLENCE - IN PROGRESS</span>
              <span className="text-emerald-400 text-xs">90% Complete</span>
            </div>
            <div className="text-neutral-200">Candidate: <strong>Alex Rivera</strong></div>
            <div className="text-neutral-400">Specialization: Senior Full-Stack Architecture</div>
            <div className="text-neutral-400">Verification Hash: <span className="text-cyan-400">0x8F9A...2C4D</span></div>
            <div className="text-emerald-400 font-bold pt-1">Requirements: 18 / 20 Sessions Completed</div>
          </div>
        </div>
      )}

      {/* Tab 4: Gaming Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="rounded-3xl bg-[#0A0A0A]/90 border border-white/15 p-6 shadow-2xl backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">
                Platform Global Leaderboard
              </h2>
            </div>
            <span className="text-xs font-mono text-neutral-400">Rankings updated live every hour</span>
          </div>

          <div className="space-y-3 font-mono">
            {LEADERBOARD.map((lb) => (
              <div
                key={lb.rank}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  lb.rank === 2
                    ? 'bg-[#141414] border-white/30 text-white shadow-md'
                    : 'bg-[#141414]/60 border-white/10 text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-xl bg-[#0A0A0A] font-extrabold text-xs text-amber-400 border border-white/15">
                    {lb.badge}
                  </span>
                  <img src={lb.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-white/20" />
                  <div>
                    <h3 className="text-xs font-bold text-white">{lb.name}</h3>
                    <p className="text-[11px] text-neutral-400">{lb.title} • {lb.xp}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span className="font-mono text-neutral-400">{lb.streak}</span>
                  <span className="font-extrabold text-emerald-400">{lb.score} Score</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Achievements;
