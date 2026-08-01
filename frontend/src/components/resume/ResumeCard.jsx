import React, { useState } from 'react';
import { FileText, Trash2, Edit3, Eye, Check, Star, Download } from 'lucide-react';
import { useResumes } from '../../context/ResumeContext';

export const ResumeCard = ({ resume, onPreview }) => {
  const { activeResumeId, setActiveResume, deleteResume, renameResume } = useResumes();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(resume.fileName);

  const isActive = activeResumeId === resume.id;

  const handleSaveRename = () => {
    if (newName.trim()) {
      renameResume(resume.id, newName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`surface-card p-5 flex flex-col justify-between space-y-4 ${
        isActive ? 'border-white/20 shadow-lg' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-emerald-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-[#141414] border border-white/20 text-xs rounded px-2 py-1 text-white"
                />
                <button onClick={handleSaveRename} className="p-1 text-emerald-400 hover:text-emerald-300">
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900 truncate max-w-[180px]">
                  {resume.fileName}
                </h3>
                <button onClick={() => setIsEditing(true)} className="text-neutral-500 hover:text-neutral-300">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <p className="text-xs text-neutral-400 mt-0.5">{resume.targetRole} • {resume.fileSize}</p>
          </div>
        </div>

        {isActive ? (
          <span className="px-2.5 py-0.5 rounded-full bg-[#141414] text-emerald-400 border border-white/20 text-[10px] font-mono font-bold flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" /> Active
          </span>
        ) : (
          <button
            onClick={() => setActiveResume(resume.id)}
            className="text-[11px] text-neutral-400 hover:text-white border border-white/15 px-2.5 py-1 rounded-lg transition-colors font-mono"
          >
            Set Active
          </button>
        )}
      </div>

      {/* ATS Score & Skills Found */}
      <div className="p-3 rounded-xl bg-[#141414]/80 border border-white/10 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-neutral-400 uppercase">ATS Match Score</span>
          <div className="text-lg font-mono font-extrabold text-emerald-400">{resume.matchScore}%</div>
        </div>
        <div className="flex flex-wrap gap-1 max-w-[140px] justify-end">
          {resume.skillsFound?.slice(0, 3).map((s, i) => (
            <span key={i} className="px-1.5 py-0.5 rounded bg-[#0A0A0A] border border-white/10 text-[10px] text-neutral-300">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Card Actions */}
      <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs font-mono">
        <button
          onClick={() => onPreview(resume)}
          className="text-neutral-400 hover:text-white font-medium flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" /> Preview Resume
        </button>

        <button
          onClick={() => deleteResume(resume.id)}
          className="text-red-400/80 hover:text-red-400 font-medium flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  );
};
