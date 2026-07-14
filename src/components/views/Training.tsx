import { useState, useEffect } from "react";
import { Save, Tv, MessageSquare, CreditCard, Clock, BrainCircuit } from "lucide-react";
import { api } from "../../api";
import { AppSettings } from "../../types";

export default function Training() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await api.saveSettings(settings);
      alert("Treinamento salvo com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar treinamento.");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof AppSettings, value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading || !settings) return <div className="bento-card" style={{ gridColumn: 'span 10', gridRow: 'span 12' }}>Carregando...</div>;

  // Calculate completeness based on 5 fields
  const fields = [settings.iptvWelcome, settings.iptvFreeTrial, settings.iptvPlans, settings.iptvPaymentMethods, settings.iptvDevices];
  const filledCount = fields.filter(f => f && f.trim().length > 0).length;
  const completeness = Math.round((filledCount / fields.length) * 100);

  return (
    <>
      <div className="bento-card min-h-[400px] lg:min-h-0" style={{ gridColumn: 'span 7', gridRow: 'span 12' }}>
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
          <div>
            <div className="card-title flex items-center gap-2">
              <Tv className="w-5 h-5 text-emerald-500" />
              Treinamento de Vendas (IPTV)
            </div>
            <p className="text-xs text-slate-400">Ensine a IA sobre como vender os seus planos e regras de atendimento.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 w-full sm:w-auto justify-center"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Salvando..." : "Salvar Tudo"}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-[10px] uppercase text-slate-500 font-bold mb-2">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                Mensagem de Boas-Vindas
              </label>
              <textarea
                value={settings.iptvWelcome || ""}
                onChange={(e) => updateField("iptvWelcome", e.target.value)}
                placeholder="Ex: Olá! Quer ter acesso a todos os canais, filmes e séries sem travamentos?"
                rows={2}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white outline-none focus:border-emerald-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-[10px] uppercase text-slate-500 font-bold mb-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Oferece Teste Gratuito? Como funciona?
              </label>
              <textarea
                value={settings.iptvFreeTrial || ""}
                onChange={(e) => updateField("iptvFreeTrial", e.target.value)}
                placeholder="Ex: Sim, oferecemos um teste grátis de 3 horas. (Ou: Não temos teste no momento)"
                rows={2}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white outline-none focus:border-emerald-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-[10px] uppercase text-slate-500 font-bold mb-2">
                <Tv className="w-3.5 h-3.5 text-slate-400" />
                Quais são os Planos e Preços?
              </label>
              <textarea
                value={settings.iptvPlans || ""}
                onChange={(e) => updateField("iptvPlans", e.target.value)}
                placeholder="Ex: Plano Mensal: R$ 35,00. Trimestral: R$ 90,00."
                rows={3}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white outline-none focus:border-emerald-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-[10px] uppercase text-slate-500 font-bold mb-2">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                Formas de Pagamento
              </label>
              <textarea
                value={settings.iptvPaymentMethods || ""}
                onChange={(e) => updateField("iptvPaymentMethods", e.target.value)}
                placeholder="Ex: Aceitamos Pix, Cartão de Crédito e Boleto."
                rows={2}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white outline-none focus:border-emerald-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-[10px] uppercase text-slate-500 font-bold mb-2">
                <Tv className="w-3.5 h-3.5 text-slate-400" />
                Dispositivos Suportados / Regras Extras
              </label>
              <textarea
                value={settings.iptvDevices || ""}
                onChange={(e) => updateField("iptvDevices", e.target.value)}
                placeholder="Ex: Funciona em TV Box, Roku, celular e PC..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white outline-none focus:border-emerald-500 transition-colors resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bento-card hidden lg:flex" style={{ gridColumn: 'span 3', gridRow: 'span 12' }}>
        <div className="card-title mb-6">Status da IA</div>
        
        <div className="flex flex-col items-center justify-center p-6 bg-slate-800/50 rounded-2xl border border-slate-700 mb-6">
          <div className="relative flex items-center justify-center mb-4">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-700"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={351.85}
                strokeDashoffset={351.85 - (351.85 * completeness) / 100}
                className="text-emerald-500 transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{completeness}%</span>
            </div>
          </div>
          <div className="text-sm font-medium text-slate-300 text-center">
            Capacidade da IA responder sozinha
          </div>
          <p className="text-xs text-slate-500 text-center mt-2">
            {completeness === 100 
              ? "Excelente! A IA tem tudo que precisa para vender." 
              : "Preencha todos os campos para melhorar as vendas."}
          </p>
        </div>

        <div className="space-y-4 mt-auto">
          <div className="p-3 rounded-xl border border-blue-900/50 bg-blue-500/10">
            <BrainCircuit className="w-5 h-5 text-blue-400 mb-2" />
            <h4 className="text-sm font-bold text-blue-100 mb-1">Como funciona a transferência?</h4>
            <p className="text-xs text-blue-200/70">A IA vai acolher o cliente e oferecer os planos. Quando ele pedir o teste ou quiser pagar, a IA te notificará no WhatsApp para você gerar o plano.</p>
          </div>
        </div>
      </div>
    </>
  );
}
