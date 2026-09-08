import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Upload, 
  Search, 
  Filter, 
  FileText, 
  Tag, 
  Calendar, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ExternalLink, 
  Copy, 
  Sparkles,
  Lock,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthRole } from '../context/AuthRoleContext';

export default function RepositoryPage({ setActiveTab, onPreloadSearchQuery, onSelectDocsForAssistant }) {
  const { role, permissions } = useAuthRole();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [themes, setThemes] = useState([]);

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Policy Brief');
  const [uploadTheme, setUploadTheme] = useState('Land Records Digitization');
  const [uploadAuthor, setUploadAuthor] = useState('Research Analyst');
  const [uploadDistricts, setUploadDistricts] = useState('National');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Document Reader Drawer state
  const [activeDoc, setActiveDoc] = useState(null);
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    loadFilters();
    loadDocuments();
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [selectedTheme, selectedCategory, search]);

  const loadFilters = async () => {
    try {
      const res = await api.getDocumentCategoriesAndThemes();
      setCategories(res.categories || []);
      setThemes(res.themes || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.getDocuments({
        category: selectedCategory,
        theme: selectedTheme,
        search: search.trim()
      });
      setDocuments(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a PDF or Text document to upload');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadMsg('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle);
      formData.append('category', uploadCategory);
      formData.append('theme', uploadTheme);
      formData.append('author', uploadAuthor);
      formData.append('district_tags', uploadDistricts);
      formData.append('uploaded_by_role', role);

      const res = await api.uploadDocument(formData);
      setUploadMsg(res.message || 'Document uploaded and indexed successfully!');
      setUploadFile(null);
      setUploadTitle('');
      await loadDocuments();
      await loadFilters();
      setTimeout(() => {
        setUploadModalOpen(false);
        setUploadMsg('');
      }, 1500);
    } catch (err) {
      setUploadError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleJumpToSearch = (doc) => {
    if (onPreloadSearchQuery) {
      onPreloadSearchQuery(`What does ${doc.title} say about land governance?`);
    }
    setActiveTab('search');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              National Land Governance Research & Policy Repository
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
              {documents.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized clearinghouse for legislative briefs, empirical tenure studies, drone cadastres, and policy evaluations
          </p>
        </div>

        {/* Upload Button */}
        <div>
          {permissions.canUploadDocuments ? (
            <button
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document (PDF / Text)</span>
            </button>
          ) : (
            <div 
              title="Only Researcher tier can upload new papers; Policymaker and Public tiers have read & analysis rights."
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-400 text-xs font-medium border border-slate-200 cursor-not-allowed"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Upload Restricted (Researcher Tier)</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search papers by keyword, title, or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Theme dropdown */}
        <div className="w-full md:w-56">
          <select
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Policy Themes</option>
            {themes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Category dropdown */}
        <div className="w-full md:w-52">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
          Loading repository documents...
        </div>
      ) : documents.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200 space-y-2">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <div className="font-semibold text-slate-700">No matching documents found</div>
          <div className="text-slate-400">Try adjusting your search query or theme filters</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-300 p-5 flex flex-col justify-between transition-all group"
            >
              <div className="space-y-3">
                {/* Header badges */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 line-clamp-1">
                    {doc.theme}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    ID #{doc.id}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                  {doc.title}
                </h3>

                {/* Meta details */}
                <div className="space-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="line-clamp-1">{doc.author || 'Dept of Land Resources'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{doc.upload_date} • {doc.category}</span>
                  </div>
                  {doc.district_tags && (
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="line-clamp-1 text-[11px] text-slate-600">
                        Districts: {doc.district_tags}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={async () => {
                    const full = await api.getDocumentById(doc.id);
                    setActiveDoc(full.data);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Inspect Text
                </button>

                <button
                  onClick={() => handleJumpToSearch(doc)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  <span>AI Q&A</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Reader Drawer Modal */}
      {activeDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {activeDoc.theme}
                </span>
                <h3 className="font-bold text-base mt-1 line-clamp-1">{activeDoc.title}</h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  Author: {activeDoc.author} • Uploaded: {activeDoc.upload_date}
                </div>
              </div>
              <button 
                onClick={() => setActiveDoc(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Extracted Text Content */}
            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50/50">
              {activeDoc.extracted_text}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => handleCopyText(activeDoc.extracted_text)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedText ? 'Copied to Clipboard!' : 'Copy Extracted Text'}</span>
              </button>

              <button
                onClick={() => {
                  handleJumpToSearch(activeDoc);
                  setActiveDoc(null);
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI Question About this Paper</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">Upload Research / Policy Document</h3>
              </div>
              <button 
                onClick={() => setUploadModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {uploadMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{uploadMsg}</span>
                </div>
              )}

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* File Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select File (.pdf, .txt, .md) *
                </label>
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-lg p-1"
                  required
                />
              </div>

              {/* Document Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Land Records Interoperability Case Study"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Theme & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Policy Theme
                  </label>
                  <select
                    value={uploadTheme}
                    onChange={(e) => setUploadTheme(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Land Records Digitization">Land Records Digitization</option>
                    <option value="Rural Land Tenure & Drone Mapping">Rural Land Tenure & Drone Mapping</option>
                    <option value="Dispute Resolution & Urban Zoning">Dispute Resolution & Urban Zoning</option>
                    <option value="Forest Rights & Tribal Land">Forest Rights & Tribal Land</option>
                    <option value="Climate Vulnerability & Land Use">Climate Vulnerability & Land Use</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Document Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="National Policy Evaluation">National Policy Evaluation</option>
                    <option value="Academic Research">Academic Research</option>
                    <option value="Government Operational Guideline">Government Operational Guideline</option>
                    <option value="Case Study & Policy Brief">Case Study & Policy Brief</option>
                  </select>
                </div>
              </div>

              {/* Author & District Tags */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Author / Organization
                  </label>
                  <input
                    type="text"
                    value={uploadAuthor}
                    onChange={(e) => setUploadAuthor(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    District Tags
                  </label>
                  <input
                    type="text"
                    placeholder="Pune, Varanasi, etc."
                    value={uploadDistricts}
                    onChange={(e) => setUploadDistricts(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {uploading ? 'Extracting & Indexing...' : 'Upload & Index'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
