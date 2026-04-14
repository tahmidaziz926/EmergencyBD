import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:3001/api" });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const triggerSOS = (sosData) => API.post("/sos/trigger", sosData);
export const getActiveSOSEvents = () => API.get("/sos/active");
export const getSOSEventById = (id) => API.get(`/sos/${id}`);
export const resolveSOSEvent = (id) => API.patch(`/sos/${id}/resolve`);
export const getNearbySOS = (latitude, longitude, maxDistance = 20000) =>
  API.get(`/sos/nearby/me?latitude=${latitude}&longitude=${longitude}&maxDistance=${maxDistance}`);