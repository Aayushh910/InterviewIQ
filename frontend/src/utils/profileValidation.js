/**
 * Helper to check whether all required candidate profile fields are filled.
 * City/Location is not a required profile field.
 */
export const REQUIRED_PROFILE_FIELDS = [
  { key: 'name', label: 'Full Name' },
  { key: 'email', label: 'Email Address' },
  { key: 'role', label: 'Current Role / Domain' },
  { key: 'targetPosition', label: 'Target Position' },
  { key: 'bio', label: 'Professional Bio' },
  { key: 'skills', label: 'Technical Skills' },
  { key: 'education', label: 'Education / Degree' },
  { key: 'github', label: 'GitHub Profile' },
  { key: 'linkedin', label: 'LinkedIn Profile' },
];

export const checkProfileCompletion = (formData) => {
  if (!formData) {
    const cached = localStorage.getItem('interviewiq_profile_completed');
    return {
      isComplete: cached === 'true',
      completedCount: cached === 'true' ? REQUIRED_PROFILE_FIELDS.length : 0,
      totalCount: REQUIRED_PROFILE_FIELDS.length,
      percentage: cached === 'true' ? 100 : 0,
      missingFields: [],
    };
  }

  const missingFields = [];
  REQUIRED_PROFILE_FIELDS.forEach(({ key, label }) => {
    const val = formData[key] || formData[key.replace(/([A-Z])/g, '_$1').toLowerCase()];
    if (!val || String(val).trim().length === 0) {
      missingFields.push({ key, label });
    }
  });

  const completedCount = REQUIRED_PROFILE_FIELDS.length - missingFields.length;
  const percentage = Math.round((completedCount / REQUIRED_PROFILE_FIELDS.length) * 100);
  const isComplete = missingFields.length === 0;

  if (isComplete) {
    localStorage.setItem('interviewiq_profile_completed', 'true');
  }

  return {
    isComplete,
    completedCount,
    totalCount: REQUIRED_PROFILE_FIELDS.length,
    percentage,
    missingFields,
  };
};
