import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_RESUMES } from '../data/mockData';

const ResumeContext = createContext({
  resumes: [],
  activeResumeId: null,
  addResume: () => {},
  deleteResume: () => {},
  renameResume: () => {},
  setActiveResume: () => {},
});

export const ResumeProvider = ({ children }) => {
  const [resumes, setResumes] = useState(() => {
    try {
      const saved = localStorage.getItem('interviewiq_resumes');
      return saved ? JSON.parse(saved) : MOCK_RESUMES;
    } catch {
      return MOCK_RESUMES;
    }
  });

  const [activeResumeId, setActiveResumeId] = useState(() => {
    return resumes[0]?.id || null;
  });

  useEffect(() => {
    let isMounted = true;
    const fetchApiResumes = async () => {
      try {
        const { apiClient } = await import('../services/apiClient');
        const res = await apiClient.get('/resumes');
        if (isMounted && res.data && res.data.length > 0) {
          setResumes(res.data);
          if (!activeResumeId) {
            setActiveResumeId(res.data[0].id);
          }
        }
      } catch (err) {
        console.warn('Backend API connection notice, using local cached resumes:', err);
      }
    };
    fetchApiResumes();

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('interviewiq_resumes', JSON.stringify(resumes));
    } catch (e) {
      console.error('Failed saving resumes to localStorage', e);
    }
  }, [resumes]);

  const addResume = (newResume) => {
    const resumeObj = {
      id: `res_${Date.now()}`,
      fileName: newResume.fileName || 'Uploaded_Resume.pdf',
      uploadDate: new Date().toISOString().split('T')[0],
      fileSize: newResume.fileSize || '250 KB',
      targetRole: newResume.targetRole || 'Full-Stack Candidate',
      matchScore: Math.floor(Math.random() * 15) + 80,
      skillsFound: newResume.skillsFound || ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
      improvementSuggestions: [
        'Quantify achievements in your recent role (e.g. boosted performance by 35%).',
        'Add certifications or cloud deployment credentials.'
      ]
    };
    setResumes((prev) => [resumeObj, ...prev]);
    if (!activeResumeId) setActiveResumeId(resumeObj.id);
    return resumeObj;
  };

  const deleteResume = (id) => {
    setResumes((prev) => prev.filter((r) => r.id !== id));
    if (activeResumeId === id) {
      const remaining = resumes.filter((r) => r.id !== id);
      setActiveResumeId(remaining[0]?.id || null);
    }
  };

  const renameResume = (id, newName) => {
    setResumes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, fileName: newName } : r))
    );
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
