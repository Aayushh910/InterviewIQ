import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SignupForm from "../../components/auth/SignupForm";
import { signup } from "../../services/authService";

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      await signup(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return <SignupForm onSubmit={handleSubmit} loading={loading} error={error} />;
}
