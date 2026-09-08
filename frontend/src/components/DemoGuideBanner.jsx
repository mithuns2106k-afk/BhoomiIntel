import React, { useState } from 'react';
import { 
  Compass, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  X, 
  ArrowRight,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { useAuthRole, ROLES } from '../context/AuthRoleContext';

export const DEMO_STEPS = [
  {
    step: 1,
    targetTab: 'gis-map',
    role: ROLES.POLICYMAKER,
    title: '1. GIS Dashboard & District Drilldown',
    instruction: 'Inspect the GIS map showing sample Indian districts. Click Pune or Varanasi (high dispute density) to examine land metrics and related research links.',
    actionLabel: 'Go to GIS Cadastre Map'
  },
  {
    step: 2,
    targetTab: 'search',
    role: ROLES.RESEARCHER,
    title: '2. Natural Language Semantic Search (RAG)',
    instruction: 'Query: "Why are land disputes high in this region?" Notice Claude synthesizes an answer with specific citations back to repository papers without hallucination.',
    actionLabel: 'Go to Semantic Search'
  },
  {
    step: 3,
    targetTab: 'simulator',
    role: ROLES.POLICYMAKER,
    title: '3. AI Policy Simulation Module (Standout Feature)',
    instruction: 'Select Pune or Varanasi, choose "Digitize land records" with 80% rollout over 3 years. Run AI simulation to view before-vs-after impact charts, risk factors, and rationale.',
    actionLabel: 'Go to Policy Simulator'
  },
  {
    step: 4,
    targetTab: 'assistant',
    role: ROLES.RESEARCHER,
    title: '4. AI Research Assistant (Trend Synthesis)',
    instruction: 'Select 3 policy papers from the repository and generate meta-analysis: common themes, policy gaps/contradictions, and 3 suggested research questions.',
    actionLabel: 'Go to Research Assistant'
  },
  {
    step: 5,
    targetTab: 'dashboard',
    role: ROLES.POLICYMAKER,
    title: '5. Role-Based Governance Dashboard',
    instruction: 'Examine how policymakers track aggregate dispute reduction KPIs, active simulations, and district health benchmarks for evidence-based governance.',
    actionLabel: 'View Policymaker Overview'
  }
];

export default function DemoGuideBanner({ activeTab, setActiveTab, onClose }) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const { setRole } = useAuthRole();

  const currentStep = DEMO_STEPS[currentStepIdx];

  const handleGoToStep = (idx) => {
    setCurrentStepIdx(idx);
    const stepObj = DEMO_STEPS[idx];
    if (stepObj.role) {
      setRole(stepObj.role);
    }
    setActiveTab(stepObj.targetTab);
  };

  const handleNext = () => {
    if (currentStepIdx < DEMO_STEPS.length - 1) {
      handleGoToStep(currentStepIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      handleGoToStep(currentStepIdx - 1);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-slate-950 px-4 py-3 shadow-lg border-b border-amber-400 relative z-30 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left info */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-400/80 rounded-lg text-slate-950 shrink-0 mt-0.5">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-950 text-amber-300 uppercase tracking-wide">
                Judge & Pitch Demo Tour ({currentStepIdx + 1}/5)
              </span>
              <span className="text-xs font-bold text-slate-950">
                {currentStep.title}
              </span>
            </div>
            <p className="text-xs text-slate-900 font-medium mt-0.5 max-w-2xl leading-snug">
              {currentStep.instruction}
            </p>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <button
            onClick={() => handleGoToStep(currentStepIdx)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-950 hover:bg-slate-900 text-amber-300 shadow-sm transition-transform active:scale-95"
          >
            <span>{currentStep.actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1 border-l border-amber-700/40 pl-2">
            <button
              onClick={handlePrev}
              disabled={currentStepIdx === 0}
              className="p-1.5 rounded-md bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 transition-colors"
              title="Previous Step"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentStepIdx === DEMO_STEPS.length - 1}
              className="p-1.5 rounded-md bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 transition-colors"
              title="Next Step"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-amber-400/60 text-slate-900 transition-colors ml-1"
              title="Close Tour Banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
