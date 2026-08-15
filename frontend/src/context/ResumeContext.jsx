import React, { createContext, useContext, useState, useEffect } from 'react';

const ResumeContext = createContext({
  resumes: [],
  activeResumeId: null,
  addResume: () => {},
  deleteResume: () => {},
  renameResume: () => {},
  setActiveResume: () => {},
});

export const ResumeProvider = ({ children }) => {
  const [resumes, setResumes] = useState([]);
  const [activeResumeId, setActiveResumeId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchApiResumes = async () => {
      try {
        const { apiClient } = await import('../services/apiClient');
        const res = await apiClient.get('/resumes');
        if (isMounted && res.data && Array.isArray(res.data)) {
          setResumes(res.data);
          if (res.data.length > 0) {
            setActiveResumeId(res.data[0].id);
          }
        }
      } catch (err) {
        // Backend endpoint not active yet or empty database
        if (isMounted) {
          setResumes([]);
        }
      }
    };
    fetchApiResumes();

    return () => { isMounted = false; };
  }, []);

  const addResume = (newResume) => {
    const resumeObj = {
      id: `res_${Date.now()}`,
      fileName: newResume.fileName || 'Uploaded_Resume.pdf',
      uploadDate: new Date().toISOString().split('T')[0],
      fileSize: newResume.fileSize || '250 KB',
      targetRole: newResume.targetRole || 'Full-Stack Candidate',
      matchScore: 85,
      skillsFound: newResume.skillsFound || ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
      improvementSuggestions: [
        'Quantify achievements in your recent role.',
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
