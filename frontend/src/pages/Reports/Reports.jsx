import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Search, Filter, Calendar, Clock, ArrowRight, Download, CheckCircle2 } from 'lucide-react';
import { useInterview } from '../../context/InterviewContext';
import { ReportDetail } from './ReportDetail';
import { Badge } from '../../components/common/Badge';

export const Reports = () => {
  const [searchParams] = useSearchParams();
  const reportId = searchParams.get('id');

  const { interviews } = useInterview();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');

  if (reportId) {
    return <ReportDetail reportIdOverride={reportId} />;
  }

  const filteredReports = interviews.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain = selectedDomain === 'All' || item.typeBadge === selectedDomain;
    return matchesSearch && matchesDomain;
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-white/20 text-emerald-400 text-xs font-mono font-semibold mb-2 shadow-sm">
            <FileText className="w-3.5 h-3.5" /> Performance Reports Archive
          </div>
          <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
            AI Interview Reports & PDF Exports
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Access granular question-by-question transcripts, voice clarity ratings, and downloadable PDF reports.
          </p>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="space-y-3">
        <div className="px-1">
          <h2 className="text-sm font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-400" /> Search & Filter Performance Scorecards
          </h2>
          <p className="text-xs text-neutral-400">Filter your saved performance reports by Technical, Behavioral, or HR domain</p>
        </div>

        <div className="rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 p-4 sm:p-6 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reports by role or title..."
              className="w-full bg-[#141414] dark:bg-[#141414] light:bg-slate-100 border border-white/15 text-xs rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto font-mono">
            <span className="text-xs text-neutral-400 font-medium">Filter Type:</span>
            {['All', 'Technical', 'Behavioral', 'HR & Cultural'].map((dom) => (
              <button
                key={dom}
                onClick={() => setSelectedDomain(dom)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  selectedDomain === dom
                    ? 'bg-white text-black font-bold shadow-md'
                    : 'bg-[#141414] text-neutral-400 hover:text-white border border-white/15'
                }`}
              >
                {dom}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        <div className="px-1">
          <h2 className="text-sm font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" /> Downloadable Performance Scorecards ({filteredReports.length})
          </h2>
          <p className="text-xs text-neutral-400">Open full AI transcript analysis or download instant official PDF reports</p>
        </div>
        {filteredReports.map((item, index) => {
          const colorList = [
            { text: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
            { text: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
            { text: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
            { text: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" }
          ];
          const color = colorList[index % colorList.length];

          return (
            <div
              key={item.id}
              className="p-6 rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/30 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${color.bg} ${color.text}`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">
                      {item.title}
                    </h3>
                    <Badge variant="emerald" size="sm" className="bg-[#141414] border-white/20 text-neutral-200 font-mono text-[10px]">{item.typeBadge || 'Technical'}</Badge>
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-1">{item.summary}</p>
                  <div className="flex items-center gap-4 text-xs text-neutral-400 font-mono pt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-neutral-500" /> {item.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-neutral-500" /> {item.duration}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-4 sm:pt-0 border-t sm:border-0 border-white/10">
                <div className="text-right font-mono">
                  <span className="text-[10px] text-neutral-400 uppercase">AI Score</span>
                  <div className={`text-xl font-extrabold ${color.text}`}>{item.score}%</div>
                </div>

                <Link
                  to={`/results/${item.id}`}
                  className="px-4 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-neutral-200 text-xs shadow-xl border border-white/20 flex items-center gap-1.5 transition-all"
                >
                  View Performance Results <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default Reports;
