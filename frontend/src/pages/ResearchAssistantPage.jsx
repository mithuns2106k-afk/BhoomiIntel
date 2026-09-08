import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  FileText, 
  CheckSquare, 
  Square, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ArrowRight,
  TrendingUp,
  Layers,
  Printer,
  Share2,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import AIBadge from '../components/AIBadge';

export default function ResearchAssistantPage({ preselectedDocIds = [], setActiveTab }) {
  const [documents, setDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState(preselectedDocIds.length >= 2 ? preselectedDocIds : [1, 2, 3]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await api.getDocuments();
      setDocuments(res.data || []);
      setSelectedDocIds(prev => prev.filter(id => (res.data || []).some(d => d.id === id)).slice(0, 4));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleDoc = (id) => {
    if (selectedDocIds.includes(id)) {
      if (selectedDocIds.length <= 2) {
        setError('Please keep at least 2 documents selected for comparative meta-analysis');
        return;
      }
      setSelectedDocIds(selectedDocIds.filter(d => d !== id));
      setError('');
    } else {
      if (selectedDocIds.length >= 4) {
        setError('Maximum 4 documents can be synthesized in a single comparative batch');
        return;
      }
      setSelectedDocIds([...selectedDocIds, id]);
      setError('');
    }
  };

  const handleRunSynthesis = async (docIds = selectedDocIds) => {
    if (!docIds || docIds.length < 2) {
      setError('Please select at least 2 documents for comparative analysis');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.runResearchAssistant(docIds);
      setReport(res.report);
    } catch (err) {
      setError(err.message || 'Synthesis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!report) return;
    const textToCopy = `
# ${report.synthesis_title}
AI Synthesis Provider: ${report.provider || 'Configured Claude model'}

## Executive Summary
${report.executive_summary}

## Common Themes across Papers
${report.common_themes?.map(t => `### ${t.theme_title}\n${t.description}`).join('\n\n')}

## Contradictions & Policy Gaps
${report.contradictions_and_policy_gaps?.map(g => `- **${g.topic}**: ${g.divergence_or_bottleneck} (Affected: ${g.affected_sectors})`).join('\n')}

## Suggested Research Questions for Further Study
${report.suggested_research_questions?.map((q, i) => `${i + 1}. **${q.question}**\n   Rationale: ${q.rationale}`).join('\n\n')}

## Strategic Policy Recommendations
${report.strategic_policy_recommendations?.map((r, i) => `${i + 1}. ${r}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveReport = async () => {
    if (!report) return;
    try {
      await api.saveResearchReport(selectedDocIds, report);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || 'Unable to save report');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 lg:p-8 text-white shadow-xl border border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <AIBadge model="Configured Claude model Synthesis" />
          <span className="text-xs text-indigo-300">• Multi-Document Meta-Analysis</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          AI Land Policy Research Assistant
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Select 2 to 4 repository documents to synthesize emerging national trends, highlight legislative contradictions or data gaps, and generate high-impact research questions for further empirical study.
        </p>

        {/* Document Selection Toolbar */}
        <div className="mt-6 pt-4 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>Select Papers to Compare ({selectedDocIds.length} of 4 selected):</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDocIds([1, 2, 3])}
                className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700"
              >
                Preset: DILRMP + SVAMITVA
              </button>
              <button
                type="button"
                onClick={() => setSelectedDocIds([3, 4, 6])}
                className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700"
              >
                Preset: Disputes & FRA
              </button>
            </div>
          </div>

          {/* Document Checkbox Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {documents.map((doc) => {
              const isSelected = selectedDocIds.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => handleToggleDoc(doc.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/40'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-white" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold line-clamp-1 leading-snug">
                      {doc.title}
                    </div>
                    <div className={`text-[10px] ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                      {doc.theme}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trigger Synthesis Button */}
          <div className="mt-4 flex items-center justify-end">
            <button
              onClick={() => handleRunSynthesis()}
              disabled={loading || selectedDocIds.length < 2}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Meta-Analysis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Synthesize Selected Papers ({selectedDocIds.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Synthesis Report View */}
      {report && !loading && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 lg:p-8 space-y-8 print:p-0 print:border-none print:shadow-none">
          {/* Report Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  National Research Synthesis Report
                </span>
                <AIBadge model={report.provider || 'Configured Claude model'} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {report.synthesis_title}
              </h3>
              <div className="text-xs text-slate-500 mt-0.5">
                Comparative analysis of {report.documents_analyzed?.length || selectedDocIds.length} foundational papers
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyReport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied Report!' : 'Copy Report'}</span>
              </button>
              <button
                onClick={handleSaveReport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{saved ? 'Saved' : 'Save Report'}</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Executive Synthesis & Meta-Analysis</span>
            </h4>
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
              {report.executive_summary}
            </div>
          </div>

          {/* Section A: Common Themes */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Cross-Cutting Themes & Convergent Findings</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {report.common_themes?.map((t, idx) => (
                <div key={idx} className="p-5 rounded-xl border border-blue-100 bg-blue-50/40 space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">
                      Theme {idx + 1}
                    </div>
                    <h5 className="font-bold text-xs text-slate-900 leading-snug">
                      {t.theme_title}
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-blue-100 text-[10px] text-slate-500">
                    <span className="font-medium">Supporting Evidence:</span> {t.supporting_documents?.join('; ') || 'Analyzed Records'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Contradictions & Policy Gaps */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>2. Contradictions, Structural Friction & Regulatory Gaps</span>
            </h4>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Topic / Domain</th>
                    <th className="p-3">Divergence or Policy Bottleneck</th>
                    <th className="p-3">Affected Sectors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {report.contradictions_and_policy_gaps?.map((g, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="p-3 font-bold text-slate-900 whitespace-nowrap">{g.topic}</td>
                      <td className="p-3 text-slate-600 leading-relaxed">{g.divergence_or_bottleneck}</td>
                      <td className="p-3 text-[11px] text-slate-500">{g.affected_sectors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section C: 3 Suggested Research Questions */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. High-Impact Suggested Research Questions for Further Study</span>
            </h4>

            <div className="space-y-3">
              {report.suggested_research_questions?.map((q, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Research Question {idx + 1}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-medium">
                      Target: {q.target_stakeholders || 'MoRD / Revenue Boards'}
                    </span>
                  </div>
                  <h5 className="font-bold text-xs sm:text-sm text-slate-900 mt-1">
                    "{q.question}"
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-semibold text-slate-700">Rationale & Policy Relevance:</span> {q.rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section D: Strategic Recommendations */}
          <div className="p-5 rounded-xl bg-slate-900 text-white space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Strategic Policy Recommendations for MoRD</span>
            </h4>
            <div className="space-y-2">
              {report.strategic_policy_recommendations?.map((r, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
