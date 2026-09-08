import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  BookOpen, 
  ExternalLink, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Clock, 
  Filter,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import AIBadge from '../components/AIBadge';

const RECOMMENDED_QUERIES = [
  "What are the main causes of land disputes in urban areas?",
  "How does SVAMITVA drone survey reduce boundary litigations?",
  "What are the primary hurdles in implementing the Forest Rights Act (FRA)?",
  "How does riverine char erosion impact land tenure and dispute dynamics?",
  "What is the impact of specialized fast-track revenue tribunals on court pendency?"
];

export default function SemanticSearchPage({ preloadedQuery, setActiveTab }) {
  const [query, setQuery] = useState(preloadedQuery || '');
  const [themeFilter, setThemeFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Auto-run if preloaded query passed
  useEffect(() => {
    if (preloadedQuery && preloadedQuery.trim()) {
      setQuery(preloadedQuery);
      handleSearch(preloadedQuery);
    }
  }, [preloadedQuery]);

  const handleSearch = async (searchQuery) => {
    const q = (searchQuery || query).trim();
    if (!q) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.searchRepository({
        query: q,
        theme: themeFilter !== 'all' ? themeFilter : null,
        district: districtFilter !== 'all' ? districtFilter : null
      });
      setResult(res);
    } catch (err) {
      setError(err.message || 'Failed to synthesize search response');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.answer) return;
    navigator.clipboard.writeText(result.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-2xl p-6 lg:p-8 text-white shadow-xl border border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <AIBadge model="Claude RAG" />
          <span className="text-xs text-blue-300">• Retrieval-Augmented Generation</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          AI Semantic Search & Policy Evidence Retrieval
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Ask questions in natural language. BhoomiIntel searches all indexed research papers and legal guidelines, and synthesizes answers with source citations while eliminating hallucination.
        </p>

        {/* Query Input Box */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }} 
          className="mt-6 flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. What are the main causes of land disputes in urban areas?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Search with Citations</span>
              </>
            )}
          </button>
        </form>

        {/* Recommended Sample Questions Chips */}
        <div className="mt-4 pt-3 border-t border-slate-800/70">
          <div className="text-[11px] font-semibold text-slate-400 mb-2">
            Recommended Questions (Demo Flow):
          </div>
          <div className="flex flex-wrap gap-1.5">
            {RECOMMENDED_QUERIES.map((rq, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(rq);
                  handleSearch(rq);
                }}
                className="text-[11px] bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-slate-700 px-3 py-1 rounded-full transition-all text-left"
              >
                {rq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
          <div className="inline-flex p-3 rounded-full bg-blue-50 text-blue-600 animate-ai-pulse">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Synthesizing Evidence-Based Policy Response...
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Scanning document chunks, computing semantic similarities, and generating factual citations with Claude API.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-blue-600 font-medium pt-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span>Validating strict source citations</span>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* AI Synthesized Answer & Source Citations */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Main Synthesized Answer Box */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 lg:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">
                      Synthesized Policy Intelligence
                    </h3>
                    <AIBadge model={result.provider || 'Claude server-side model'} />
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Grounded on {result.citations?.length || 0} retrieved policy documents
                  </div>
                </div>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy Answer'}</span>
              </button>
            </div>

            {/* Answer Text formatted */}
            <div className="prose prose-sm max-w-none text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
              {result.answer}
            </div>

            {/* Anti-Hallucination Disclaimer */}
            <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <b>Zero-Hallucination Guarantee:</b> This answer is strictly synthesized from the indexed repository records. Any claim not corroborated by cited papers is explicitly identified.
              </span>
            </div>
          </div>

          {/* Source Document Citations (RAG Excerpts) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Source Document Citations ({result.citations?.length || 0})
              </h3>
              <button
                onClick={() => setActiveTab('repository')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>Browse Full Repository</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.citations?.map((c, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs hover:border-blue-300 transition-all space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 line-clamp-1">
                        Citation [Doc {idx + 1}]
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Match Score: {c.score || '9.5'}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 line-clamp-2">
                      {c.title}
                    </h4>

                    <div className="text-[11px] text-slate-500 font-medium">
                      Theme: {c.theme} • Category: {c.category}
                    </div>

                    {/* Excerpt snippet */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px] text-slate-700 italic leading-relaxed">
                      "{c.excerpt}"
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => setActiveTab('repository')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <span>Inspect in Repository</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
