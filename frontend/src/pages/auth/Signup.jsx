import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SignupForm from "../../components/auth/SignupForm";
import { useAuth } from "../../context/AuthContext";

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Candidate';
      const result = await signup(fullName, data.email, data.password);
      if (result?.success) {
        navigate("/dashboard");
      } else {
        setError(result?.error || "Registration failed. Email may already be registered.");
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return <SignupForm onSubmit={handleSubmit} loading={loading} error={error} />;
}
