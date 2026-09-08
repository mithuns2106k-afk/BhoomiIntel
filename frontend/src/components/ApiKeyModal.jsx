import React, { useState, useEffect } from 'react';
import { Key, CheckCircle2, AlertCircle, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

export default function ApiKeyModal({ isOpen, onClose, onUpdated }) {
  const [status, setStatus] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    try {
      const res = await api.getConfigStatus();
      setStatus(res);
      setError('');
    } catch (err) {
      setError('Could not reach backend configuration service');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('Please enter a valid Anthropic API key (starts with sk-ant-)');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await api.updateApiKey(apiKey.trim());
      setSuccessMsg('Claude API key updated successfully! Live Claude processing enabled.');
      setApiKey('');
      await loadStatus();
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err.message || 'Failed to save API key');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setError('');
    try {
      await api.resetApiKey();
      setSuccessMsg('Reverted to built-in econometric fallback engine (Demo Mode).');
      await loadStatus();
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err.message || 'Failed to reset key');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-base">Claude API & AI Engine Settings</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-300 hover:text-white rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status card */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Current AI Status
            </div>
            {status ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${status.claude_configured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="font-medium text-sm text-slate-800">
                      {status.claude_configured ? 'Live Claude' : 'Econometric Fallback Engine'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {status.claude_configured 
                      ? `Key: ${status.masked_key}` 
                      : 'Running hackathon demo mode with deterministic econometric outputs'}
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                  status.claude_configured 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {status.mode}
                </span>
              </div>
            ) : (
              <div className="text-sm text-slate-500 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" /> Loading configuration...
              </div>
            )}
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Anthropic API Key (Optional for Live Calls)
              </label>
              <input
                type="password"
                placeholder="sk-ant-api03-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                Enter your key to unlock live Anthropic Claude-powered RAG citations & policy simulations. If left blank, the built-in econometric engine handles all queries seamlessly.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={loading || !status?.claude_configured}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Clear Key / Use Demo
              </button>
              <button
                type="submit"
                disabled={loading || !apiKey.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                Save Key & Connect
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
