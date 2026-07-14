import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// In-memory Database (For demonstration purposes)
let settings = {
  responseTime: "imediato", // imediato, 1min, 5min
  businessHoursStart: "08:00",
  businessHoursEnd: "18:00",
  welcomeMessage: "Olá! Como posso ajudar você hoje?",
  awayMessage: "No momento estamos fora do horário de atendimento. Deixe sua mensagem e responderemos em breve.",
  endMessage: "Agradecemos o contato. Tenha um ótimo dia!",
  signature: "🤖 IA de Atendimento",
  whatsappConnected: false,
  iptvWelcome: "Olá! Quer ter acesso a todos os canais, filmes e séries sem travamentos?",
  iptvFreeTrial: "Sim, temos teste grátis de 3 horas.",
  iptvPlans: "Plano Mensal: R$ 35,00",
  iptvPaymentMethods: "Pix",
  iptvDevices: "Funciona em Smart TV, TV Box, Celular (Android/iPhone) e Computador.",
};

let trainingData = [
  {
    id: "1",
    category: "Geral",
    title: "Sobre a empresa",
    content: "Somos uma loja online focada em produtos de tecnologia e inovação.",
  }
];

let chatHistory: any[] = [];

// WhatsApp State
let waSocket: any = null;
let waStatus = "DISCONNECTED"; // DISCONNECTED, CONNECTING, QR_READY, CONNECTED
let waQr = "";
let waPairingCode = "";

let activeChats: Record<string, { jid: string, status: "AI" | "HUMAN", lastMessage: string, timestamp: number }> = {};

async function generateAIResponse(message: string, userId: string) {
  // Check business hours
  const now = new Date();
  const currentHour = now.getHours();
  const startHour = parseInt(settings.businessHoursStart.split(":")[0]);
  const endHour = parseInt(settings.businessHoursEnd.split(":")[0]);
  
  let isAway = currentHour < startHour || currentHour >= endHour;

  const knowledgeContext = trainingData.map(item => `[${item.category}] ${item.title}:\n${item.content}`).join("\n\n");
  const signatureRule = settings.signature ? `\nAo terminar uma conversa ou cumprimentar, você pode assinar como: "${settings.signature}"` : "";

  const systemInstruction = `
Você é um especialista em vendas de IPTV, atuando no atendimento (acolhimento) de clientes no WhatsApp.
O SEU OBJETIVO É EXCLUSIVAMENTE VENDER IPTV.

O fluxo do atendimento deve ser:
1. Acolhimento: Recepcionar o cliente de forma muito simpática e humana. Sempre comece baseando-se nesta mensagem de boas-vindas: "${settings.iptvWelcome || "Olá!"}"
2. Descoberta e Oferta: Entender o que ele procura e focar totalmente em vender os planos de IPTV. Mostrar os benefícios (canais, filmes, séries, sem travamentos).
3. Fechamento: Quando o cliente decidir comprar o plano, ou quando quiser fazer o teste gratuito (se houver), você DEVE dizer a ele que vai transferir para o responsável técnico que irá gerar o plano/teste dele. E no final da sua mensagem, inclua EXATAMENTE a tag: [TRANSFERIR].

REGRAS ESTABELECIDAS:
1. NUNCA diga que você é uma inteligência artificial ou um robô. Aja 100% como humano.
2. A linguagem deve ser extremamente natural, usar gírias comuns, variar a forma de escrever, e usar excelente gramática do português brasileiro.
3. Demonstre empatia e cordialidade.
4. Baseie-se APENAS nas informações de venda abaixo para preços e políticas.
5. Você faz o acolhimento e a venda. Você NÃO gera o plano e NÃO gera o teste. Quando o cliente topar o plano ou pedir o teste, passe para o humano usando a tag [TRANSFERIR].
${signatureRule}

INFORMAÇÕES DE VENDA (IPTV):
- Tem teste grátis?: ${settings.iptvFreeTrial || "Verifique com o vendedor."}
- Planos e Preços: ${settings.iptvPlans || "Verifique com o vendedor."}
- Formas de Pagamento: ${settings.iptvPaymentMethods || "Verifique com o vendedor."}
- Dispositivos Suportados: ${settings.iptvDevices || "Verifique com o vendedor."}

BASE DE CONHECIMENTO ADICIONAL:
${knowledgeContext || "Nenhuma informação extra cadastrada no momento."}

A HORA ATUAL É: ${now.toLocaleTimeString("pt-BR")}.
  `.trim();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const reply = response.text || "Desculpe, não consegui processar sua mensagem no momento.";
    
    // Save to chat history log for the dashboard
    chatHistory.push({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userMessage: message,
      aiResponse: reply.replace("[TRANSFERIR]", "").trim()
    });

    return reply;
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "Desculpe, ocorreu um erro no processamento da IA.";
  }
}

async function startWhatsApp() {
  if (waStatus === "CONNECTING" || waStatus === "CONNECTED") return;
  waStatus = "CONNECTING";
  
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
  const { version } = await fetchLatestBaileysVersion();
  
  const sock = makeWASocket({
    version,
    printQRInTerminal: false,
    auth: state,
    logger: pino({ level: "silent" }) as any,
    browser: ["Ubuntu", "Chrome", "20.0.04"]
  });
  
  sock.ev.on('creds.update', saveCreds);
  
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      waStatus = "QR_READY";
      waQr = await QRCode.toDataURL(qr);
    }
    
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
      waStatus = "DISCONNECTED";
      waQr = "";
      waPairingCode = "";
      waSocket = null;
      if (shouldReconnect) {
        startWhatsApp();
      } else {
        if (fs.existsSync('baileys_auth_info')) {
           fs.rmSync('baileys_auth_info', { recursive: true, force: true });
        }
      }
    } else if (connection === 'open') {
      waStatus = "CONNECTED";
      waQr = "";
      waPairingCode = "";
      console.log('WhatsApp Connected!');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    if (m.type !== 'notify') return;
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;
    if (!jid || jid.includes("@g.us")) return; // Ignore groups

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!text) return;
    
    // Register or update active chat
    if (!activeChats[jid]) {
      activeChats[jid] = { jid, status: "AI", lastMessage: text, timestamp: Date.now() };
    } else {
      activeChats[jid].lastMessage = text;
      activeChats[jid].timestamp = Date.now();
    }

    // If user is already handled by human, ignore
    if (activeChats[jid].status === "HUMAN") return;

    console.log(`Mensagem recebida de ${jid}: ${text}`);
    
    // Simulate delay
    await new Promise(r => setTimeout(r, 1500));
    await sock.readMessages([msg.key]);

    const reply = await generateAIResponse(text, jid);
    
    let cleanReply = reply;
    if (reply.includes("[TRANSFERIR]")) {
      activeChats[jid].status = "HUMAN"; // Human takes over from here
      cleanReply = reply.replace("[TRANSFERIR]", "").trim();
    }

    await sock.sendMessage(jid, { text: cleanReply });
  });

  waSocket = sock;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API Routes
  
  // -- Settings --
  app.get("/api/settings", (req, res) => {
    res.json(settings);
  });

  app.post("/api/settings", (req, res) => {
    settings = { ...settings, ...req.body };
    res.json({ success: true, settings });
  });

  // -- Training Data --
  app.get("/api/training", (req, res) => {
    res.json(trainingData);
  });

  app.post("/api/training", (req, res) => {
    trainingData = req.body;
    res.json({ success: true, trainingData });
  });

  // -- Chat History --
  app.get("/api/history", (req, res) => {
    res.json(chatHistory);
  });
  
  app.post("/api/history/clear", (req, res) => {
    chatHistory = [];
    res.json({ success: true });
  });

  // -- Active Chats --
  app.get("/api/chats", (req, res) => {
    res.json(Object.values(activeChats));
  });

  app.post("/api/chats/toggle", (req, res) => {
    const { jid } = req.body;
    if (activeChats[jid]) {
      activeChats[jid].status = activeChats[jid].status === "AI" ? "HUMAN" : "AI";
      res.json({ success: true, chat: activeChats[jid] });
    } else {
      res.status(404).json({ error: "Chat not found" });
    }
  });

  // -- WhatsApp API --
  app.get("/api/whatsapp/status", (req, res) => {
    res.json({ status: waStatus, qr: waQr, pairingCode: waPairingCode });
  });

  app.post("/api/whatsapp/start", async (req, res) => {
    if (waStatus === "DISCONNECTED") {
      startWhatsApp();
    }
    res.json({ status: waStatus });
  });

  app.post("/api/whatsapp/pairing", async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: "Número obrigatório" });
    
    try {
      if (waStatus === "DISCONNECTED") {
        await startWhatsApp();
        await new Promise(r => setTimeout(r, 2000));
      }
      
      if (!waSocket) {
        return res.status(500).json({ error: "Socket não iniciado" });
      }

      // Format number (remove non-digits)
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      const code = await waSocket.requestPairingCode(cleanNumber);
      waPairingCode = code;
      res.json({ code });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/whatsapp/logout", async (req, res) => {
    if (waSocket) {
      waSocket.logout();
    }
    res.json({ success: true });
  });

  app.post("/api/whatsapp/reset", async (req, res) => {
    try {
      if (waSocket) {
        waSocket.end(undefined);
        waSocket = null;
      }
      waStatus = "DISCONNECTED";
      waQr = "";
      waPairingCode = "";
      if (fs.existsSync('baileys_auth_info')) {
        fs.rmSync('baileys_auth_info', { recursive: true, force: true });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
