// Centralized Mock Data Source for InterviewIQ AI SaaS

export const MOCK_USERS = {
  admin: {
    id: 'usr_admin_01',
    name: 'Admin User',
    email: 'admin@interviewiq.ai',
    role: 'Platform Administrator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isAdmin: true,
  },
  candidate: {
    id: 'usr_cand_01',
    name: 'Alex Rivera',
    email: 'candidate@interviewiq.ai',
    role: 'Senior Full-Stack Candidate',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isAdmin: false,
  }
};

export const MOCK_STATS = {
  readinessScore: 88.5,
  readinessChange: '+4.2%',
  totalSessions: 18,
  totalHours: 12.5,
  avgKnowledgeDepth: '92.4%',
  facialComposure: '89.2%',
  vocalPace: '141 WPM',
  skillsBreakdown: [
    { name: 'Technical Knowledge', score: 92 },
    { name: 'STAR Response Method', score: 86 },
    { name: 'Communication & Tone', score: 89 },
    { name: 'Eye Contact & Posture', score: 90 },
    { name: 'Problem Solving & Logic', score: 87 },
  ]
};

export const MOCK_INTERVIEWS = [
  {
    id: 'int_101',
    title: 'Senior Frontend & React System Architecture',
    mode: 'resume-jd',
    modeLabel: 'Resume & JD Match',
    role: 'Senior React Developer',
    date: '2026-07-26',
    timeAgo: 'Yesterday',
    duration: '35 Mins',
    score: 92,
    status: 'Completed',
    summary: 'Demonstrated exceptional knowledge of Virtual DOM rendering, state normalization, and custom React hooks. Maintained 94% eye contact and smooth vocal pace.',
    typeBadge: 'Technical',
  },
  {
    id: 'int_102',
    title: 'Behavioral STAR Method: Conflict & Leadership',
    mode: 'behavioral',
    modeLabel: 'Behavioral STAR',
    role: 'Tech Lead / Engineering Manager',
    date: '2026-07-24',
    timeAgo: '3 Days Ago',
    duration: '30 Mins',
    score: 88,
    status: 'Completed',
    summary: 'Structured responses using Situation-Task-Action-Result methodology. Good tone stability with low filler word usage (1.2 per min).',
    typeBadge: 'Behavioral',
  },
  {
    id: 'int_103',
    title: 'Java Microservices & Distributed Caching',
    mode: 'general',
    modeLabel: 'General Technical & HR',
    role: 'Backend Architect',
    date: '2026-07-22',
    timeAgo: '5 Days Ago',
    duration: '40 Mins',
    score: 85,
    status: 'Completed',
    summary: 'Solid architectural reasoning for API gateway rate limiting. Room for improvement on edge case error handling under high concurrency.',
    typeBadge: 'Technical',
  },
  {
    id: 'int_104',
    title: 'HR Cultural Fit & Communication Deep Dive',
    mode: 'custom',
    modeLabel: 'Custom Session',
    role: 'Full-Stack Developer',
    date: '2026-07-18',
    timeAgo: '1 Week Ago',
    duration: '25 Mins',
    score: 90,
    status: 'Completed',
    summary: 'Articulate career journey summary. Strong emotional composure and posture confidence throughout the interview.',
    typeBadge: 'HR & Cultural',
  }
];

export const MOCK_REPORTS = {
  'int_101': {
    id: 'int_101',
    title: 'Senior Frontend & React System Architecture',
    candidateName: 'Alex Rivera',
    date: 'July 26, 2026',
    duration: '35 Mins',
    overallScore: 92,
    scores: {
      technicalSkills: 94,
      communication: 90,
      confidence: 92,
      facialExpression: 89,
      voiceAnalysis: 91,
      eyeContact: 95,
    },
    voiceMetrics: {
      paceWPM: 141,
      paceStatus: 'Optimal (130-150 WPM)',
      fillerWordCount: 4,
      clarityScore: '94%',
    },
    facialMetrics: {
      eyeContactRatio: '95%',
      postureScore: '92% Upright',
      composureRating: 'High Confidence',
    },
    aiRecommendations: [
      'Elaborate more on memory leak prevention when discussing React useEffect cleanup callbacks.',
      'Maintain steady eye contact when reflecting on complex technical trade-offs.',
      'Quantify past performance improvements (e.g., "Reduced LCP by 40%").'
    ],
    learningRoadmap: [
      { topic: 'React 18 Concurrent Rendering & Transitions', status: 'In Progress' },
      { topic: 'Web Worker Offloading for Heavy Calculations', status: 'Recommended' },
      { topic: 'Advanced Browser Performance Profiling (Chrome DevTools)', status: 'Mastered' }
    ]
  }
};

export const MOCK_RESUMES = [
  {
    id: 'res_01',
    fileName: 'Alex_Rivera_Senior_FullStack_Resume.pdf',
    uploadDate: '2026-07-20',
    fileSize: '240 KB',
    targetRole: 'Senior Full-Stack Developer',
    matchScore: 94,
    skillsFound: ['React 18', 'TypeScript', 'Node.js', 'GraphQL', 'PostgreSQL', 'Docker', 'AWS'],
    improvementSuggestions: [
      'Add quantifiable metric outcomes for your lead role at TechCorp (e.g. "Increased test coverage from 60% to 92%")',
      'Specify CI/CD pipeline tools used in project section.'
    ]
  },
  {
    id: 'res_02',
    fileName: 'Alex_Rivera_TechLead_CV.pdf',
    uploadDate: '2026-06-15',
    fileSize: '310 KB',
    targetRole: 'Engineering Manager / Lead',
    matchScore: 88,
    skillsFound: ['Engineering Management', 'System Design', 'Agile/Scrum', 'React', 'Go'],
    improvementSuggestions: [
      'Highlight team size and mentorship impact in summary statement.'
    ]
  }
];

export const MOCK_COACH_DATA = {
  dailyChallenges: [
    { id: 'ch_1', title: 'Explain Closures in 60 Seconds', category: 'Technical', difficulty: 'Medium', points: 50 },
    { id: 'ch_2', title: 'STAR Answer: Dealing with a Tight Deadline', category: 'Behavioral', difficulty: 'Easy', points: 30 },
    { id: 'ch_3', title: 'Design a Distributed Rate Limiter', category: 'System Design', difficulty: 'Hard', points: 100 },
  ],
  roadmaps: [
    { step: 1, title: 'Mastering Technical Foundations', progress: 100, status: 'Completed' },
    { step: 2, title: 'Behavioral & STAR Method Fluency', progress: 85, status: 'Active' },
    { step: 3, title: 'Live AI Practice & High-Pressure Mock Loops', progress: 60, status: 'Active' },
    { step: 4, title: 'Offer Negotiation & Executive Composure', progress: 0, status: 'Upcoming' },
  ]
};

export const MOCK_SAVED_PRESETS = [
  {
    id: 'pst_1',
    title: 'Senior Frontend React Specialist',
    level: 'Senior',
    duration: '30 Mins',
    mode: 'general',
    tags: ['React 18', 'State Normalization', 'Performance', 'CSS/Tailwind'],
    description: 'Deep dive into modern React architecture, hooks, state management, and web performance optimization.'
  },
  {
    id: 'pst_2',
    title: 'Backend Node & Distributed Services',
    level: 'Mid-Level',
    duration: '45 Mins',
    mode: 'general',
    tags: ['API Gateway', 'Microservices', 'PostgreSQL', 'Redis'],
    description: 'Scenario-based assessment for high-concurrency microservices, authentication, and database indexing.'
  },
  {
    id: 'pst_3',
    title: 'Full-Stack Web Architect',
    level: 'Staff / Lead',
    duration: '45 Mins',
    mode: 'resume-jd',
    tags: ['System Architecture', 'Full-Stack', 'CI/CD', 'Scalability'],
    description: 'Cross-examines your uploaded CV against high-growth tech lead job descriptions.'
  },
  {
    id: 'pst_4',
    title: 'Behavioral STAR & Leadership Loop',
    level: 'Senior',
    duration: '30 Mins',
    mode: 'behavioral',
    tags: ['STAR Method', 'Conflict Resolution', 'Project Impact'],
    description: 'Evaluates situational leadership, team conflict resolution, and executive communication.'
  }
];
