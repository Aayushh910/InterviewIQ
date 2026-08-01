import React from 'react';
import { motion } from 'framer-motion';
import { Sliders, Video, FileText, Check, Sparkles, ChevronRight, HelpCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { useResumes } from '../../context/ResumeContext';

const DOMAINS = [
  'Frontend', 'Backend', 'Full Stack', 'Python', 'Java', 'C++',
  'Data Science', 'Machine Learning', 'Cloud', 'DevOps', 'Cyber Security', 'SQL'
];

const QUESTION_COUNTS = [5, 10, 15, 20];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const EXPERIENCE_LEVELS = ['Fresher', '1+', '2+', '3+', '5+', '10+'];

export const InterviewConfigStep = ({ config, onChange, onNext }) => {
  const { resumes } = useResumes();

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141414] border border-white/20 text-emerald-400 text-xs font-mono font-semibold shadow-sm">
          <Sliders className="w-4 h-4" /> Step 1 of 4: Interview Setup
        </div>
        <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
          Configure Your AI Mock Interview
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto">
          Tailor the question pool, difficulty, domain, and evaluation metrics to match your target role.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-3xl bg-[#0A0A0A]/90 dark:bg-[#0A0A0A]/90 light:bg-white border border-white/15 dark:border-white/15 light:border-slate-200 p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
        
        {/* Interview Type Selector */}
        <div>
          <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 dark:text-neutral-300 light:text-slate-700 mb-3">
            Interview Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => onChange({ interviewType: 'Technical' })}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                config.interviewType === 'Technical'
                  ? 'bg-[#141414] border-white/30 text-white shadow-lg'
                  : 'bg-[#141414]/60 dark:bg-[#141414]/60 light:bg-slate-50 border-white/10 text-neutral-400 hover:border-white/20'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                config.interviewType === 'Technical' ? 'bg-white text-black' : 'bg-black text-neutral-400 border border-white/10'
              }`}>
                <Video className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white dark:text-white light:text-slate-900">
                  Technical Interview
                </div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  Coding logic, algorithms, architecture, & framework deep-dives.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onChange({ interviewType: 'HR' })}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                config.interviewType === 'HR'
                  ? 'bg-[#141414] border-white/30 text-white shadow-lg'
                  : 'bg-[#141414]/60 dark:bg-[#141414]/60 light:bg-slate-50 border-white/10 text-neutral-400 hover:border-white/20'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                config.interviewType === 'HR' ? 'bg-white text-black' : 'bg-black text-neutral-400 border border-white/10'
              }`}>
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white dark:text-white light:text-slate-900">
                  HR & Behavioral Interview
                </div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  STAR method, situational leadership, culture fit, & conflict resolution.
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Domain Selection (Technical Only) */}
        {config.interviewType === 'Technical' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 dark:text-neutral-300 light:text-slate-700 mb-3">
              Technical Domain
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
              {DOMAINS.map((dom) => (
                <button
                  type="button"
                  key={dom}
                  onClick={() => onChange({ domain: dom })}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    config.domain === dom
                      ? 'bg-white text-black font-bold shadow-md border-white'
                      : 'bg-[#141414]/80 dark:bg-[#141414]/80 light:bg-slate-50 border-white/10 text-neutral-400 hover:border-white/20'
                  }`}
                >
                  {dom}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Interview Mode & Resume Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 dark:text-neutral-300 light:text-slate-700 mb-2">
              Interview Mode
            </label>
            <div className="grid grid-cols-2 gap-2 font-mono">
              <button
                type="button"
                onClick={() => onChange({ mode: 'General' })}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold ${
                  config.mode === 'General'
                    ? 'bg-white text-black font-bold shadow-md border-white'
                    : 'bg-[#141414]/80 border-white/10 text-neutral-400'
                }`}
              >
                General Mode
              </button>
              <button
                type="button"
                onClick={() => onChange({ mode: 'Resume Based' })}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold ${
                  config.mode === 'Resume Based'
                    ? 'bg-white text-black font-bold shadow-md border-white'
                    : 'bg-[#141414]/80 border-white/10 text-neutral-400'
                }`}
              >
                Resume Based Mode
              </button>
            </div>
          </div>

          {/* Resume Dropdown (Visible if Resume Based) */}
          {config.mode === 'Resume Based' && (
            <div>
              <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 dark:text-neutral-300 light:text-slate-700 mb-2">
                Select Uploaded Resume
              </label>
              <select
                value={config.resumeId}
                onChange={(e) => onChange({ resumeId: e.target.value })}
                className="w-full bg-[#141414] dark:bg-[#141414] light:bg-slate-100 border border-white/15 text-xs rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400 transition-colors"
              >
                <option value="">-- Choose Resume --</option>
                {resumes.map((res) => (
                  <option key={res.id} value={res.id}>
                    {res.fileName} ({res.targetRole})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Question Count, Difficulty, Experience Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          {/* Number of Questions */}
          <div>
            <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 dark:text-neutral-300 light:text-slate-700 mb-2">
              Number of Questions
            </label>
            <select
              value={config.questionsCount}
              onChange={(e) => onChange({ questionsCount: Number(e.target.value) })}
              className="w-full bg-[#141414] dark:bg-[#141414] light:bg-slate-100 border border-white/15 text-xs rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400 transition-colors"
            >
              {QUESTION_COUNTS.map((num) => (
                <option key={num} value={num}>
                  {num} Questions ({num * 5} Mins)
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 dark:text-neutral-300 light:text-slate-700 mb-2">
              Difficulty Level
            </label>
            <div className="flex rounded-xl bg-[#141414] border border-white/15 p-1 font-mono">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => onChange({ difficulty: diff })}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    config.difficulty === diff
                      ? 'bg-white text-black font-bold shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-xs font-bold uppercase font-mono tracking-wider text-neutral-300 dark:text-neutral-300 light:text-slate-700 mb-2">
              Experience Level
            </label>
            <select
              value={config.experience}
              onChange={(e) => onChange({ experience: e.target.value })}
              className="w-full bg-[#141414] dark:bg-[#141414] light:bg-slate-100 border border-white/15 text-xs rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400 transition-colors"
            >
              {EXPERIENCE_LEVELS.map((exp) => (
                <option key={exp} value={exp}>
                  {exp} Years Experience
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Counter Questions Toggle & Language */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#141414]/80 border border-white/10">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="counterQuestions"
              checked={config.counterQuestions}
              onChange={(e) => onChange({ counterQuestions: e.target.checked })}
              className="w-4 h-4 rounded border-white/20 bg-black text-emerald-400 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="counterQuestions" className="text-xs text-neutral-200 font-semibold cursor-pointer">
              Enable Adaptive Follow-up / Counter Questions
              <span className="block text-[11px] text-neutral-400 font-normal">
                AI interviewer will dynamically generate cross-examination questions based on your answers.
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0A0A0A] border border-white/15 text-xs text-neutral-300 font-mono shrink-0">
            Language: <span className="text-emerald-400 font-bold">English (US)</span>
          </div>
        </div>

        {/* Submit / Proceed Button */}
        <div className="pt-4 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={ChevronRight}
            iconPosition="right"
            className="w-full sm:w-auto bg-white text-black font-bold hover:bg-neutral-200 shadow-xl border border-white/20 text-xs sm:text-sm px-6 py-3"
          >
            Continue to Device Check
          </Button>
        </div>
      </form>
    </motion.div>
  );
};
