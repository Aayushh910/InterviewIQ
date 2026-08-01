import React from 'react';
import { Link } from 'react-router-dom';
import { Video, Calendar, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Badge } from '../common/Badge';

export const RecentInterviews = ({ interviews }) => {
  const recentList = interviews?.slice(0, 5) || [];

  return (
    <section className="surface-container p-6 sm:p-7 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-emerald-400">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Recent Practice Loops & Reports
              </h2>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">Review your 5 most recent interview transcripts, scores & PDF feedback</p>
            </div>
          </div>
          <Link
            to="/history"
            className="text-xs font-mono font-semibold text-emerald-400 hover:underline flex items-center gap-1"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {recentList.map((item) => (
            <div
              key={item.id}
              className="surface-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      {item.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-[#1A1A1A] border border-white/10 text-neutral-300 font-mono text-[10px]">{item.typeBadge || 'Technical'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-neutral-500" /> {item.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-neutral-500" /> {item.duration}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-white/10">
                <div className="text-right">
                  <div className="text-sm font-mono font-extrabold text-emerald-400">{item.score}% Score</div>
                  <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Saved
                  </span>
                </div>
                <Link
                  to={`/reports?id=${item.id}`}
                  className="surface-control px-3.5 py-2 text-neutral-200 text-xs font-semibold"
                >
                  View Report
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentInterviews;
