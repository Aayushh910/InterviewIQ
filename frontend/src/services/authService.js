import api from "./api";
import { saveToken, saveUser } from "../utils/storage";

export async function login({ email, password }) {
  const data = await api.post("/auth/login", { email, password });
  saveToken(data.access_token);
  saveUser(data.user);
  return data;
}

export async function signup({ firstName, lastName, email, password, phone }) {
  const data = await api.post("/auth/signup", {
    first_name: firstName,
    last_name: lastName,
    email,
    password,
    phone: phone || null,
  });
  saveToken(data.access_token);
  saveUser(data.user);
  return data;
}

export async function getMe() {
  return api.get("/auth/me");
}

export async function logout() {
  return { success: true };
}
