// Types for the application

export interface AppSettings {
  responseTime: string;
  businessHoursStart: string;
  businessHoursEnd: string;
  welcomeMessage: string;
  awayMessage: string;
  endMessage: string;
  signature: string;
  whatsappConnected: boolean;
  iptvWelcome?: string;
  iptvFreeTrial?: string;
  iptvPlans?: string;
  iptvPaymentMethods?: string;
  iptvDevices?: string;
}

export interface TrainingItem {
  id: string;
  category: string;
  title: string;
  content: string;
}

export interface ChatHistoryLog {
  id: string;
  timestamp: string;
  userMessage: string;
  aiResponse: string;
  jid?: string;
  name?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
