import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setCredentials, setLoading, setError, logout as logoutAction } from "../store/authSlice";
import { login as loginService, signup as signupService } from "../services/authService";

export function useAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, loading, error } = useSelector((s) => s.auth);

  const login = async (credentials) => {
    dispatch(setLoading(true));
    try {
      const data = await loginService(credentials);
      dispatch(setCredentials({ user: data.user, token: data.access_token }));
      navigate("/dashboard");
    } catch (err) {
      dispatch(setError(err.message));
    }
  };

  const signup = async (info) => {
    dispatch(setLoading(true));
    try {
      const data = await signupService(info);
      dispatch(setCredentials({ user: data.user, token: data.access_token }));
      navigate("/dashboard");
    } catch (err) {
      dispatch(setError(err.message));
    }
  };

  const logout = () => {
    dispatch(logoutAction());
    navigate("/");
  };

  return { user, token, loading, error, login, signup, logout, isAuthenticated: !!token };
}
