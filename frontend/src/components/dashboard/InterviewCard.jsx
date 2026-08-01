import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Calendar, Award, ChevronRight } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { Badge } from '../common/Badge';

export const InterviewCard = ({ interview }) => {
  const navigate = useNavigate();

  return (
    <GlassCard className="p-5 border-white/10 hover:border-tealAccent/40 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <Badge variant={interview.score >= 85 ? 'emerald' : 'amber'} size="sm">
            Score: {interview.score}%
          </Badge>
          <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {interview.date}
          </span>
        </div>

        <h3 className="font-display font-bold text-gray-100 text-base mb-1">{interview.title}</h3>
        <p className="text-xs text-gray-400 line-clamp-2">{interview.summary}</p>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
        <span className="text-gray-400 font-mono">{interview.duration}</span>
        <button
          onClick={() => navigate(`/reports?id=${interview.id}`)}
          className="text-tealAccent font-semibold hover:underline flex items-center gap-1"
        >
          View Performance Report <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </GlassCard>
  );
};
