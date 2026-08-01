import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { History as HistoryIcon, Search, Calendar, Clock, Video, RotateCcw, FileText, BarChart3, ChevronDown } from 'lucide-react';
import { useInterview } from '../../context/InterviewContext';
import { Badge } from '../../components/common/Badge';

export const History = () => {
  const { interviews } = useInterview();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest' | 'score_high' | 'score_low'

  const filteredHistory = interviews
    .filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMode = filterMode === 'All' || item.typeBadge === filterMode;
      return matchesSearch && matchesMode;
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.date) - new Date(a.date);
      if (sortOrder === 'oldest') return new Date(a.date) - new Date(b.date);
      if (sortOrder === 'score_high') return b.score - a.score;
      if (sortOrder === 'score_low') return a.score - b.score;
      return 0;
    });

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-white/20 text-cyan-400 text-xs font-mono font-semibold mb-2">
            <HistoryIcon className="w-3.5 h-3.5" /> Session Timeline
          </div>
          <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
            Interview Session History
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Timeline of all your past AI mock interviews, detailed transcripts, and performance trends.
          </p>
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="space-y-3">
        <div className="px-1">
          <h2 className="text-sm font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-400" /> Filter & Search Past Sessions
          </h2>
          <p className="text-xs text-neutral-400">Search by technical role, filter by interview domain, or sort by AI performance score</p>
        </div>

        <div className="rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 p-4 sm:p-6 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search history by role or title..."
              className="w-full bg-[#141414] dark:bg-[#141414] light:bg-slate-100 border border-white/15 text-xs rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {/* Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-400 font-medium font-mono">Filter:</span>
              {['All', 'Technical', 'Behavioral', 'HR & Cultural'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterMode(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    filterMode === f
                      ? 'bg-white text-black font-bold shadow-md'
                      : 'bg-[#141414] text-neutral-400 hover:text-white border border-white/15'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-[#141414] dark:bg-[#141414] light:bg-slate-100 border border-white/15 text-xs rounded-xl p-2.5 text-neutral-200 focus:outline-none focus:border-emerald-400"
            >
              <option value="newest">Sort: Date (Newest)</option>
              <option value="oldest">Sort: Date (Oldest)</option>
              <option value="score_high">Sort: Score (Highest)</option>
              <option value="score_low">Sort: Score (Lowest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Timeline Table / Card List */}
      <div className="space-y-4">
        <div className="px-1">
          <h2 className="text-sm font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <HistoryIcon className="w-4 h-4 text-cyan-400" /> Completed AI Practice Sessions ({filteredHistory.length})
          </h2>
          <p className="text-xs text-neutral-400">Click any session to view complete Q&A transcripts, audio analysis, or retake the interview</p>
        </div>
        {filteredHistory.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 shadow-2xl backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-white/30 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-white/15 flex items-center justify-center text-emerald-400 shrink-0">
                <Video className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">
                    {item.title}
                  </h3>
                  <Badge variant="emerald" size="sm" className="bg-[#141414] border-white/20 text-neutral-200 font-mono text-[10px]">{item.typeBadge || 'Technical'}</Badge>
                </div>
                <p className="text-xs text-neutral-400">{item.role}</p>

                <div className="flex items-center gap-4 text-xs text-neutral-400 font-mono pt-1">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-neutral-500" /> {item.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-neutral-500" /> {item.duration}</span>
                  <span className="text-emerald-400 font-bold">{item.score}% AI Score</span>
                </div>
              </div>
            </div>

            {/* Actions: View Report, View Analytics, Retake */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-0 border-white/10 justify-end">
              <Link
                to={`/reports?id=${item.id}`}
                className="px-3.5 py-2 rounded-xl bg-[#141414] hover:bg-[#1f1f1f] text-neutral-200 text-xs font-semibold flex items-center gap-1.5 border border-white/15 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" /> View Report
              </Link>

              <Link
                to="/analytics"
                className="px-3.5 py-2 rounded-xl bg-[#141414] hover:bg-[#1f1f1f] text-neutral-200 text-xs font-semibold flex items-center gap-1.5 border border-white/15 transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400" /> View Analytics
              </Link>

              <Link
                to="/interview"
                className="px-3.5 py-2 rounded-xl bg-[#141414] hover:bg-[#1f1f1f] border border-white/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retake
              </Link>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default History;
