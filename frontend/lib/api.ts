import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// Auth
export const login = (email: string, password: string) =>
  api.post("/api/v1/auth/login", { email, password });

export const getMe = () => api.get("/api/v1/auth/me");

// Tenders
export const getTenders = () => api.get("/api/v1/tenders/");
export const createTender = (data: object) => api.post("/api/v1/tenders/", data);

// Bidders
export const getBidders = (tenderId: string) => api.get(`/api/v1/bidders/tender/${tenderId}`);
export const addBidder = (tenderId: string, data: object) =>
  api.post(`/api/v1/bidders/tender/${tenderId}`, data);

// Verifications
export const runVerification = (bidderId: string) =>
  api.post(`/api/v1/verifications/${bidderId}/run`);
export const getChecks = (bidderId: string) =>
  api.get(`/api/v1/verifications/${bidderId}/checks`);
export const getScore = (bidderId: string) =>
  api.get(`/api/v1/verifications/${bidderId}/score`);
export const getRecommendation = (bidderId: string) =>
  api.get(`/api/v1/verifications/${bidderId}/recommendation`);
export const runWhatIf = (bidderId: string, overrides: Record<string, string>) =>
  api.post(`/api/v1/verifications/${bidderId}/whatif`, { overrides });

// Decisions
export const makeDecision = (bidderId: string, decision: string, reason: string) =>
  api.post(`/api/v1/decisions/${bidderId}`, { decision, reason });
export const getDecision = (bidderId: string) =>
  api.get(`/api/v1/decisions/${bidderId}`);

// Audit
export const getAuditLogs = (bidderId?: string) =>
  api.get("/api/v1/audit/logs", { params: bidderId ? { bidder_id: bidderId } : {} });

// Reports
export const getHeatmap = (tenderId: string) =>
  api.get(`/api/v1/reports/tender/${tenderId}/heatmap`);
export const downloadReport = (bidderId: string) =>
  api.get(`/api/v1/reports/${bidderId}/pdf`, { responseType: "blob" });

// Batch
export const triggerBatch = (tenderId: string) =>
  api.post("/api/v1/verifications/batch/trigger", { tender_id: tenderId });
export const getBatchStatus = (taskId: string) =>
  api.get(`/api/v1/verifications/batch/${taskId}`);
