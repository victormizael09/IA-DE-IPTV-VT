import { AppSettings, TrainingItem, ChatHistoryLog } from "./types";

export const api = {
  getSettings: async (): Promise<AppSettings> => {
    const res = await fetch("/api/settings");
    if (!res.ok) throw new Error("Failed to fetch settings");
    return res.json();
  },
  
  saveSettings: async (settings: Partial<AppSettings>): Promise<{ success: boolean; settings: AppSettings }> => {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error("Failed to save settings");
    return res.json();
  },

  getTrainingData: async (): Promise<TrainingItem[]> => {
    const res = await fetch("/api/training");
    if (!res.ok) throw new Error("Failed to fetch training data");
    return res.json();
  },

  saveTrainingData: async (data: TrainingItem[]): Promise<{ success: boolean; trainingData: TrainingItem[] }> => {
    const res = await fetch("/api/training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to save training data");
    return res.json();
  },

  getChatHistory: async (): Promise<ChatHistoryLog[]> => {
    const res = await fetch("/api/history");
    if (!res.ok) throw new Error("Failed to fetch history");
    return res.json();
  },

  clearChatHistory: async (): Promise<{ success: boolean }> => {
    const res = await fetch("/api/history/clear", { method: "POST" });
    if (!res.ok) throw new Error("Failed to clear history");
    return res.json();
  },

  sendChatMessage: async (message: string, history: { role: string; content: string }[]): Promise<{ reply: string }> => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
    });
    if (!res.ok) throw new Error("Failed to send message");
    return res.json();
  },

  getActiveChats: async (): Promise<{ jid: string; status: "AI" | "HUMAN"; lastMessage: string; timestamp: number }[]> => {
    const res = await fetch("/api/chats");
    if (!res.ok) throw new Error("Failed to fetch active chats");
    return res.json();
  },

  toggleActiveChat: async (jid: string): Promise<{ success: boolean; chat: any }> => {
    const res = await fetch("/api/chats/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jid }),
    });
    if (!res.ok) throw new Error("Failed to toggle chat");
    return res.json();
  },

  getWaStatus: async (): Promise<{ status: string; qr?: string; pairingCode?: string }> => {
    const res = await fetch("/api/whatsapp/status");
    if (!res.ok) throw new Error("Failed to fetch WhatsApp status");
    return res.json();
  },

  startWa: async (): Promise<{ status: string }> => {
    const res = await fetch("/api/whatsapp/start", { method: "POST" });
    if (!res.ok) throw new Error("Failed to start WhatsApp");
    return res.json();
  },

  requestWaPairingCode: async (phoneNumber: string): Promise<{ code: string }> => {
    const res = await fetch("/api/whatsapp/pairing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to request pairing code");
    }
    return res.json();
  },

  logoutWa: async (): Promise<{ success: boolean }> => {
    const res = await fetch("/api/whatsapp/logout", { method: "POST" });
    if (!res.ok) throw new Error("Failed to logout WhatsApp");
    return res.json();
  },

  resetWa: async (): Promise<{ success: boolean }> => {
    const res = await fetch("/api/whatsapp/reset", { method: "POST" });
    if (!res.ok) throw new Error("Failed to reset WhatsApp");
    return res.json();
  },
};
