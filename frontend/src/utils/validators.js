export const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validatePassword = (password) =>
  /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

export const validateRequired = (value) =>
  value?.trim().length > 0;
