import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../../components/auth/LoginForm";
import { login } from "../../services/authService";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return <LoginForm onSubmit={handleSubmit} loading={loading} />;
}
