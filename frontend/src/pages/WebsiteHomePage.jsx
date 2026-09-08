import React from 'react';
import { ArrowRight, BookOpen, Map, ShieldCheck, Sparkles, BarChart3, FileSearch, Landmark, CheckCircle2 } from 'lucide-react';

const features = [
  { icon: FileSearch, title: 'Research Intelligence', text: 'Search land-governance research in natural language and trace answers back to repository evidence.' },
  { icon: Map, title: 'GIS Land Intelligence', text: 'Explore district indicators for disputes, climate vulnerability and land-use efficiency on an interactive map.' },
  { icon: Sparkles, title: 'AI Policy Simulation', text: 'Test policy interventions with transparent assumptions, projected outcomes, risks and confidence.' },
  { icon: BookOpen, title: 'Research Assistant', text: 'Compare multiple documents to identify themes, disagreements, gaps and future research questions.' },
];

export default function WebsiteHomePage({ onSignIn, onExplore }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-emerald-600 flex items-center justify-center text-white shadow-md">
              <Landmark className="w-5 h-5" />
            </div>
            <div><div className="font-bold tracking-tight">BhoomiIntel</div><div className="text-[10px] text-slate-500">Land Governance Intelligence</div></div>
          </button>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#platform" className="hover:text-blue-700">Platform</a>
            <a href="#workflow" className="hover:text-blue-700">Workflow</a>
            <a href="#transparency" className="hover:text-blue-700">Trust & AI</a>
          </nav>
          <button onClick={onSignIn} className="rounded-xl bg-slate-950 text-white px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 transition">Sign in</button>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_15%_20%,_rgba(16,185,129,0.20),_transparent_30%),radial-gradient(circle_at_85%_15%,_rgba(37,99,235,0.25),_transparent_34%)]" />
          <div className="relative max-w-7xl mx-auto px-5 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-[1.15fr_.85fr] gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 mb-6">
                <Sparkles className="w-3.5 h-3.5" /> Evidence → Insight → Decision
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">AI-powered intelligence for better land governance.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">BhoomiIntel brings research evidence, district-level GIS intelligence and transparent policy simulation into one decision-support platform for researchers and policymakers.</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <button onClick={onSignIn} className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-950 px-5 py-3.5 font-semibold hover:bg-emerald-50 transition">Enter platform <ArrowRight className="w-4 h-4" /></button>
                <button onClick={onExplore} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-5 py-3.5 font-semibold text-white hover:bg-slate-800 transition">Explore capabilities</button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Role-based access</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Source-grounded AI</span>
                <span className="inline-flex items-center gap-1.5"><Map className="w-4 h-4 text-blue-400" /> Interactive GIS</span>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-700 bg-white/[0.05] p-5 shadow-2xl">
              <div className="rounded-2xl bg-white text-slate-900 p-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div><div className="text-xs font-semibold text-blue-700">DECISION SUPPORT</div><div className="font-bold mt-1">District Intelligence</div></div>
                  <span className="text-[10px] rounded-full px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200">Live official DILRMP connector</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {['Land disputes', 'Climate risk', 'Land efficiency', 'Digitization'].map((label, i) => (
                    <div key={label} className="rounded-xl bg-slate-50 border border-slate-200 p-4"><div className="text-xs text-slate-500">{label}</div><div className="text-xl font-bold mt-1">{[248, 'High', '72%', '81%'][i]}</div></div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl bg-blue-50 border border-blue-100 p-4">
                  <div className="text-xs font-semibold text-blue-800">AI POLICY INSIGHT</div>
                  <p className="text-sm leading-6 mt-1 text-slate-700">Evaluate an intervention against district conditions before moving from evidence to action.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="max-w-7xl mx-auto px-5 lg:px-8 py-20">
          <div className="max-w-2xl"><div className="text-sm font-bold text-blue-700">ONE PLATFORM, FOUR CAPABILITIES</div><h2 className="text-3xl sm:text-4xl font-bold mt-2 tracking-tight">From scattered evidence to an actionable policy view.</h2><p className="text-slate-600 mt-4 leading-7">Every module connects to the same evidence and district context, so users can move from a research question to a policy decision without switching systems.</p></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
            {features.map(({icon: Icon, title, text}) => <article key={title} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition"><div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center"><Icon className="w-5 h-5" /></div><h3 className="font-bold mt-5">{title}</h3><p className="text-sm text-slate-600 leading-6 mt-2">{text}</p></article>)}
          </div>
        </section>

        <section id="workflow" className="bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-5 lg:px-8 py-20">
            <div className="text-center max-w-2xl mx-auto"><div className="text-sm font-bold text-emerald-700">CONNECTED WORKFLOW</div><h2 className="text-3xl sm:text-4xl font-bold mt-2">Evidence → Insight → Simulation → Decision</h2><p className="text-slate-600 mt-4">BhoomiIntel is designed around the actual workflow of land-governance research and policy analysis.</p></div>
            <div className="grid md:grid-cols-4 gap-4 mt-12">
              {['Research evidence', 'AI-grounded insight', 'GIS + policy simulation', 'Decision support'].map((step, i) => <div key={step} className="relative rounded-2xl border border-slate-200 p-6 bg-slate-50"><div className="text-xs font-bold text-blue-700">0{i+1}</div><h3 className="font-bold mt-3">{step}</h3><p className="text-sm text-slate-600 mt-2 leading-6">{['Upload, organize and discover relevant land-governance documents.', 'Ask natural-language questions and trace claims to source excerpts.', 'Understand regional conditions and test intervention scenarios.', 'Compare evidence, assumptions, risks and projected outcomes.'][i]}</p></div>)}
            </div>
          </div>
        </section>

        <section id="transparency" className="max-w-7xl mx-auto px-5 lg:px-8 py-20">
          <div className="rounded-3xl bg-slate-950 text-white p-8 lg:p-12 grid lg:grid-cols-2 gap-10 items-center">
            <div><div className="text-sm font-bold text-emerald-400">TRUST BY DESIGN</div><h2 className="text-3xl font-bold mt-2">AI that shows its work, not just its answer.</h2><p className="text-slate-300 mt-4 leading-7">AI-generated research outputs are grounded in supplied repository evidence. Policy projections expose assumptions, risks and confidence, and are clearly labeled as decision-support rather than validated forecasts.</p></div>
            <div className="grid sm:grid-cols-2 gap-3"><div className="rounded-2xl bg-white/5 border border-white/10 p-5"><ShieldCheck className="text-emerald-400 w-5 h-5"/><div className="font-semibold mt-3">Role-aware access</div><div className="text-xs text-slate-400 mt-1">Permissions enforced server-side.</div></div><div className="rounded-2xl bg-white/5 border border-white/10 p-5"><FileSearch className="text-blue-400 w-5 h-5"/><div className="font-semibold mt-3">Traceable evidence</div><div className="text-xs text-slate-400 mt-1">Source citations accompany AI answers.</div></div><div className="rounded-2xl bg-white/5 border border-white/10 p-5"><BarChart3 className="text-indigo-400 w-5 h-5"/><div className="font-semibold mt-3">Transparent projections</div><div className="text-xs text-slate-400 mt-1">Assumptions and confidence are visible.</div></div><div className="rounded-2xl bg-white/5 border border-white/10 p-5"><Map className="text-emerald-400 w-5 h-5"/><div className="font-semibold mt-3">Spatial context</div><div className="text-xs text-slate-400 mt-1">District intelligence informs analysis.</div></div></div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-8 flex flex-col md:flex-row gap-4 justify-between text-xs"><div><div className="text-white font-semibold">BhoomiIntel</div><div className="mt-1">Land Governance Intelligence Platform</div></div><div>Smart India Hackathon PS 26019 · Official DILRMP runtime data with transparent demo-layer disclosure</div></div>
      </footer>
    </div>
  );
}
