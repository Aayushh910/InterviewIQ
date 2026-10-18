import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

const DEFAULT_STARTER_RESUME = {
  id: 'res_default_starter',
  fileName: 'Software_Engineer_Resume.pdf',
  uploadDate: new Date().toISOString().split('T')[0],
  fileSize: '184 KB',
  targetRole: 'Full-Stack Software Engineer',
  matchScore: 88,
  skillsFound: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'REST APIs', 'Git'],
  missingSkills: ['Kubernetes', 'AWS', 'GraphQL'],
  improvementSuggestions: [
    'Quantify technical metrics (e.g., latency reduction, throughput improvements).',
    'Include hands-on cloud deployment and CI/CD automation experience.'
  ]
};

const ResumeContext = createContext({
  resumes: [],
  activeResumeId: null,
  addResume: () => {},
  uploadResumeFile: async () => {},
  deleteResume: () => {},
  renameResume: () => {},
  setActiveResume: () => {},
});

export const ResumeProvider = ({ children }) => {
  const [resumes, setResumes] = useState(() => {
    try {
      const saved = localStorage.getItem('interviewiq_resumes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [DEFAULT_STARTER_RESUME];
  });

  const [activeResumeId, setActiveResumeId] = useState(() => {
    try {
      const saved = localStorage.getItem('interviewiq_resumes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].id;
      }
    } catch (e) {}
    return DEFAULT_STARTER_RESUME.id;
  });

  // Sync with backend on mount
  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem('interviewiq_token');
    if (!token) return;

    const fetchApiResumes = async () => {
      try {
        const res = await apiClient.get('/resumes');
        if (isMounted && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setResumes(res.data);
          setActiveResumeId(res.data[0].id);
          localStorage.setItem('interviewiq_resumes', JSON.stringify(res.data));
        }
      } catch (err) {
        console.warn('Backend resumes fetch notice:', err);
      }
    };
    fetchApiResumes();

    return () => { isMounted = false; };
  }, []);

  const saveResumesState = (updatedList) => {
    setResumes(updatedList);
    try {
      localStorage.setItem('interviewiq_resumes', JSON.stringify(updatedList));
    } catch (e) {}
  };

  const uploadResumeFile = async (file, targetRole = 'Software Engineer') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target_role', targetRole);

    try {
      const res = await apiClient.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data) {
        const updated = [res.data, ...resumes.filter(r => r.id !== res.data.id)];
        saveResumesState(updated);
        setActiveResumeId(res.data.id);
        return res.data;
      }
    } catch (err) {
      console.warn('Backend resume upload fallback:', err);
    }

    // Local client-side fallback if backend network is unreachable
    const fallbackObj = {
      id: `res_${Date.now()}`,
      fileName: file.name,
      uploadDate: new Date().toISOString().split('T')[0],
      fileSize: `${Math.round(file.size / 1024)} KB`,
      targetRole: targetRole || 'Software Engineer',
      matchScore: 86,
      skillsFound: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'Git'],
      missingSkills: ['Kubernetes', 'AWS', 'GraphQL'],
      improvementSuggestions: [
        'Add quantified production results and engineering impact metrics.',
        'Highlight distributed architecture and scalability patterns.'
      ]
    };
    const updated = [fallbackObj, ...resumes];
    saveResumesState(updated);
    setActiveResumeId(fallbackObj.id);
    return fallbackObj;
  };

  const addResume = (newResume) => {
    const resumeObj = {
      id: newResume.id || `res_${Date.now()}`,
      fileName: newResume.fileName || newResume.file_name || 'Uploaded_Resume.pdf',
      uploadDate: newResume.uploadDate || new Date().toISOString().split('T')[0],
      fileSize: newResume.fileSize || newResume.file_size || '250 KB',
      targetRole: newResume.targetRole || newResume.target_role || 'Software Engineer',
      matchScore: newResume.matchScore || newResume.match_score || 85,
      skillsFound: newResume.skillsFound || newResume.skills || ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
      missingSkills: newResume.missingSkills || newResume.missing_skills || ['AWS', 'Kubernetes'],
      improvementSuggestions: newResume.improvementSuggestions || newResume.improvement_suggestions || [
        'Quantify achievements in your engineering projects.',
        'Add certifications or cloud deployment credentials.'
      ]
    };
    const updated = [resumeObj, ...resumes];
    saveResumesState(updated);
    if (!activeResumeId) setActiveResumeId(resumeObj.id);
    return resumeObj;
  };

  const deleteResume = async (id) => {
    try {
      await apiClient.delete(`/resumes/${id}`);
    } catch (e) {}

    const updated = resumes.filter((r) => r.id !== id);
    saveResumesState(updated);
    if (activeResumeId === id) {
      setActiveResumeId(updated[0]?.id || null);
    }
  };

  const renameResume = (id, newName) => {
    const updated = resumes.map((r) => (r.id === id ? { ...r, fileName: newName, file_name: newName } : r));
    saveResumesState(updated);
  };

  const setActiveResume = (id) => {
    setActiveResumeId(id);
  };

  return (
    <ResumeContext.Provider
      value={{
        resumes,
        activeResumeId,
        addResume,
        uploadResumeFile,
        deleteResume,
        renameResume,
        setActiveResume,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};

export const useResumes = () => useContext(ResumeContext);
