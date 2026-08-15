import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, Star, FileSearch } from 'lucide-react';
import { ResumeUploader } from '../../components/resume/ResumeUploader';
import { ResumeCard } from '../../components/resume/ResumeCard';
import { ATSAnalysis } from '../../components/resume/ATSAnalysis';
import { ResumeCharts } from '../../components/resume/ResumeCharts';
import { useResumes } from '../../context/ResumeContext';

export const Resume = () => {
  const { resumes, activeResumeId } = useResumes();
  const [previewResume, setPreviewResume] = useState(null);

  const activeResume = resumes.find((r) => r.id === activeResumeId) || resumes[0];

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
            <FileText className="w-3.5 h-3.5" /> Resume Intelligence Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-sans font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
            Resume Management & ATS Optimization
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Upload multiple target resumes to calculate ATS scores, skill gaps, and fuel your AI mock interviews.
          </p>
        </div>
      </div>

      {/* Uploader Card */}
      <ResumeUploader />

      {/* Uploaded Resumes Grid / Empty State */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-current" /> Uploaded Resumes & Target Role Profiles ({resumes.length})
          </h2>
          <p className="text-xs text-neutral-400">Select your active resume to automatically sync keywords & skills with your AI Technical Mock loops</p>
        </div>

        {resumes.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#0A0A0A] border border-white/15 text-center space-y-3 shadow-2xl backdrop-blur-xl">
            <FileSearch className="w-10 h-10 text-neutral-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No Resumes Uploaded Yet</h3>
            <p className="text-xs text-neutral-400 font-mono max-w-sm mx-auto">
              Upload your resume (PDF or DOCX) above to unlock automated ATS keyword matching, skill gap analysis, and target position scoring.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((res) => (
              <ResumeCard key={res.id} resume={res} onPreview={setPreviewResume} />
            ))}
          </div>
        )}
      </div>

      {/* Active Resume ATS Analysis & Charts (Only when Resumes Exist) */}
      {activeResume && (
        <>
          <ATSAnalysis resume={activeResume} />
          <ResumeCharts resume={activeResume} />
        </>
      )}

      {/* Preview Resume Modal */}
      <AnimatePresence>
        {previewResume && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewResume(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-2xl bg-[#0A0A0A] border border-white/15 rounded-3xl p-6 shadow-2xl text-white space-y-4 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white">{previewResume.fileName || previewResume.file_name || 'Resume.pdf'}</h3>
                  <p className="text-xs text-neutral-400">{previewResume.targetRole || previewResume.target_role || 'Software Role'} • Uploaded {previewResume.uploadDate || 'Recently'}</p>
                </div>
                <button onClick={() => setPreviewResume(null)} className="p-1 text-neutral-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 rounded-2xl bg-[#141414] border border-white/10 space-y-4 font-mono text-xs text-neutral-300">
                <div className="border-b border-white/10 pb-3">
                  <span className="text-cyan-400 font-bold block mb-1">Target Role: {previewResume.targetRole || previewResume.target_role || 'Target Software Role'}</span>
                  <span>ATS Match Score: {previewResume.matchScore || previewResume.match_score || 85}%</span>
                </div>
                <div>
                  <span className="text-neutral-400 font-bold block mb-1">Extracted Technical Skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(previewResume.skillsFound || previewResume.skills || []).map((sk, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-[#0A0A0A] border border-white/15 text-cyan-400 text-xs">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setPreviewResume(null)}
                  className="px-4 py-2 rounded-xl bg-[#141414] hover:bg-[#222222] text-neutral-200 text-xs font-semibold border border-white/15"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Resume;
