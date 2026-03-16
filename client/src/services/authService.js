import axios from "axios";

const API = "http://localhost:3001/api/auth";

export const registerUser = (data) => axios.post(`${API}/register`, data);
export const loginUser = (data) => axios.post(`${API}/login`, data);
export const getProfile = (token) => axios.get(`${API}/profile`, {
  headers: { Authorization: `Bearer ${token}` }
});
export const updateProfile = (data, token) => axios.put(`${API}/profile`, data, {
  headers: { Authorization: `Bearer ${token}` }
});