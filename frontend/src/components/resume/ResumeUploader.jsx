import React, { useState } from 'react';
import { UploadCloud, FileText, Sparkles, AlertCircle } from 'lucide-react';
import { useResumes } from '../../context/ResumeContext';

export const ResumeUploader = () => {
  const { addResume } = useResumes();
  const [targetRole, setTargetRole] = useState('Senior Full-Stack Candidate');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setTimeout(() => {
      addResume({
        fileName: file.name,
        fileSize: `${Math.round(file.size / 1024)} KB`,
        targetRole: targetRole || 'Software Candidate',
        skillsFound: ['React 18', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'Tailwind CSS'],
      });
      setIsUploading(false);
    }, 1200);
  };

  return (
    <section className="surface-container p-6 sm:p-8 space-y-4">
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-emerald-400">
          <UploadCloud className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">
            Upload & Analyze Resume
          </h2>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">Upload PDF or DOCX to calculate ATS score & extract tech keywords</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="relative border-2 border-dashed border-white/15 hover:border-white/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-[#141414]/60 hover:bg-[#141414] group">
            <input
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-[#0A0A0A] border border-white/15 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-white dark:text-white light:text-slate-800">
              {isUploading ? 'Parsing Resume & Running ATS Scan...' : 'Click to Upload or Drag & Drop File'}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Supports PDF, DOCX (Max 10MB). Synced with AI Interview setup.
            </div>
          </label>
        </div>

        <div className="p-4 rounded-2xl bg-[#141414]/80 border border-white/10 space-y-3 flex flex-col justify-between">
          <div>
            <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1.5">
              Target Job Role
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior React Developer"
              className="w-full bg-[#0A0A0A] border border-white/15 text-xs rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          <div className="p-2.5 rounded-xl bg-[#0A0A0A] border border-white/15 text-[11px] text-emerald-400 font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Resumes automatically sync to your Technical Mock loops.</span>
          </div>
        </div>
      </div>
    </section>
  );
};
