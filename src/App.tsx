/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import Dashboard from "./components/views/Dashboard";
import Connection from "./components/views/Connection";
import Training from "./components/views/Training";

export default function App() {
  const [currentView, setCurrentView] = useState("dashboard");

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard />;
      case "connection":
        return <Connection />;
      case "training":
        return <Training />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="bento-grid">
      {/* Sidebar / Navigation */}
      <div className="bento-card !p-4 lg:!p-5" style={{ gridColumn: 'span 2', gridRow: 'span 12' }}>
        <div className="flex flex-row lg:flex-col justify-between lg:justify-start items-center lg:items-start gap-4 lg:gap-2 mb-0 lg:mb-8 w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white shrink-0">W</div>
            <span className="font-bold text-lg hidden sm:block lg:block">WhatsApp AI</span>
          </div>
          
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto w-full lg:w-auto scrollbar-hide">
            <button 
              className={`sidebar-item ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentView('dashboard')}
            >
              Painel
            </button>
            <button 
              className={`sidebar-item ${currentView === 'training' ? 'active' : ''}`}
              onClick={() => setCurrentView('training')}
            >
              Treinamento
            </button>
            <button 
              className={`sidebar-item ${currentView === 'connection' ? 'active' : ''}`}
              onClick={() => setCurrentView('connection')}
            >
              Conexão
            </button>
          </div>
        </div>

        <div className="mt-auto hidden lg:block">
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <div className="text-[10px] uppercase text-slate-500 mb-1">API Gemini</div>
            <div className="flex items-center gap-2">
              <div className="accent-dot"></div>
              <span className="text-xs font-mono">Conectado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {renderView()}
    </div>
  );
}
