import React from 'react';
import { Volume2, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

export const QuestionCard = ({
  questionNumber = 2,
  totalQuestions = 5,
  title = "System Design & Distributed Scalability",
  question = "How would you design a distributed rate limiter for an API gateway serving 500k requests per second? Detail your data store selection and trade-offs.",
  onNextQuestion,
}) => {
  return (
    <GlassCard className="p-6 border-tealAccent/30">
      <div className="flex items-center justify-between mb-4">
        <Badge variant="cyan" size="sm">
          Question {questionNumber} of {totalQuestions}
        </Badge>
        <button className="p-2 rounded-lg bg-white/5 text-gray-300 hover:text-tealAccent hover:bg-white/10 flex items-center gap-1.5 text-xs font-mono">
          <Volume2 className="w-4 h-4 text-tealAccent" /> Play Question Audio
        </button>
      </div>

      <h3 className="text-lg font-display font-extrabold text-gray-100 mb-3">{title}</h3>
      <p className="text-gray-200 text-sm sm:text-base leading-relaxed font-light mb-6">
        "{question}"
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <span className="text-xs text-gray-400 font-mono">AI Evaluator Listening...</span>
        <Button
          variant="glow"
          size="sm"
          icon={ArrowRight}
          iconPosition="right"
          onClick={onNextQuestion}
        >
          Submit Answer & Next
        </Button>
      </div>
    </GlassCard>
  );
};
