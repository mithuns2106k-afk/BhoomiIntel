import React from 'react';
import { Sparkles, Info } from 'lucide-react';

export default function AIBadge({ model = 'Configured Claude model', showTooltip = true, className = '' }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-xs ${className}`}>
      <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
      <span>AI-Generated</span>
      <span className="text-[10px] opacity-75 font-normal">({model})</span>
      {showTooltip && (
        <span 
          title="Generated via Anthropic Claude API with strict evidence-grounding constraints to eliminate hallucination in government policy decision-support."
          className="cursor-help text-indigo-500 hover:text-indigo-800 transition-colors ml-0.5"
        >
          <Info className="w-3 h-3" />
        </span>
      )}
    </div>
  );
}
