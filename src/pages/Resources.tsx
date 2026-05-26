import React, { useState, useMemo } from "react";
import { useAppStore, Resource } from "../store";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, ExternalLink, Search, Folder, FolderOpen, File as FileIcon, ChevronRight, ChevronDown } from "lucide-react";

const TreeFolder = ({ 
  category, 
  resources, 
  removeResource, 
  expanded, 
  toggleExpand 
}: { 
  category: string, 
  resources: Resource[], 
  removeResource: (id: string) => void,
  expanded: boolean,
  toggleExpand: () => void
}) => {
  return (
    <div className="mb-2">
      <button 
        onClick={toggleExpand}
        className="w-full flex items-center gap-3 p-3 bg-line hover:bg-highlight border-2 border-ink rounded-xl font-bold text-ink transition-colors group"
      >
        {expanded ? <FolderOpen className="w-5 h-5 text-ink" /> : <Folder className="w-5 h-5 text-ink" />}
        <span className="text-sm md:text-base uppercase tracking-widest flex-1 text-left">{category}</span>
        <span className="text-xs bg-bg border-2 border-ink px-2 py-0.5 rounded-md">{resources.length}</span>
        {expanded ? <ChevronDown className="w-4 h-4 opacity-50 group-hover:opacity-100" /> : <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pl-6 md:pl-8 py-2 relative border-l-2 border-ink ml-5 mt-2 space-y-2">
              {resources.map((res, i) => (
                <div 
                  key={res.id} 
                  className="flex items-center gap-3 bg-bg border-2 border-ink p-3 rounded-xl hover:bg-highlight transition-all group relative ml-4"
                >
                  <div className="absolute top-1/2 -left-4 w-4 h-0.5 bg-ink -translate-y-1/2"></div>
                  <FileIcon className="w-4 h-4 text-sub group-hover:text-ink shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm md:text-base text-ink truncate">{res.title}</h4>
                    {res.notes && <p className="text-xs text-sub truncate">{res.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a 
                      href={res.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-2 bg-ink text-bg rounded-lg hover:bg-sub transition-colors"
                      title="Visit Link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button 
                      onClick={() => removeResource(res.id)} 
                      className="p-2 text-sub hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete Resource"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Resources() {
  const { resources, addResource, removeResource } = useAppStore();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");

  const categories = useMemo(() => {
    const cats = new Set(resources.map(r => r.category));
    return ["ALL", ...Array.from(cats)].sort();
  }, [resources]);

  // Expand all folders by default when search is active or first loaded
  React.useEffect(() => {
    const newState: Record<string, boolean> = {};
    categories.forEach(c => {
      if (c !== "ALL") newState[c] = true;
    });
    setExpandedFolders(newState);
  }, [categories.length]); // Only re-run if number of categories changes

  const filtered = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || 
                          r.category.toLowerCase().includes(search.toLowerCase()) ||
                          (r.notes && r.notes.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = activeCategory === "ALL" || r.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedResources = useMemo(() => {
    const groups: Record<string, Resource[]> = {};
    filtered.forEach(res => {
      if (!groups[res.category]) groups[res.category] = [];
      groups[res.category].push(res);
    });
    return groups;
  }, [filtered]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;
    addResource({
      id: crypto.randomUUID(),
      title,
      url,
      category: category.trim() || "Uncategorized",
      notes: notes.trim()
    });
    setTitle("");
    setUrl("");
    setCategory("");
    setNotes("");
    setShowAdd(false);
  };

  const toggleFolder = (cat: string) => {
    setExpandedFolders(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tighter text-ink mb-1 md:mb-2 flex items-center gap-3">
            <FolderOpen className="w-8 h-8 md:w-10 md:h-10 shrink-0" /> RESOURCES
          </h1>
          <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-sub">Your personal knowledge base and links.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-ink hover:bg-sub text-bg px-5 md:px-6 py-3 md:py-4 font-bold uppercase tracking-widest text-xs md:text-sm transition-all flex justify-center items-center gap-2 border-2 border-transparent hover:shadow-[4px_4px_0px_var(--theme-sub)] hover:-translate-y-1 rounded-xl w-full md:w-auto mt-2 md:mt-0"
        >
          <Plus className="w-4 h-4" /> ADD LINK
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-highlight border-2 border-ink rounded-2xl md:rounded-3xl p-5 md:p-8 overflow-hidden shadow-[4px_4px_0px_var(--theme-ink)]"
            onSubmit={handleAdd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-ink mb-2">Title</label>
                <input required value={title} onChange={e => setTitle(e.target.value)} type="text" className="w-full px-4 py-3 border-2 border-ink rounded-xl text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" placeholder="e.g. React Documentation" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-ink mb-2">URL</label>
                <input required value={url} onChange={e => setUrl(e.target.value)} type="url" className="w-full px-4 py-3 border-2 border-ink rounded-xl text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-ink mb-2">Category</label>
                <input value={category} onChange={e => setCategory(e.target.value)} type="text" className="w-full px-4 py-3 border-2 border-ink rounded-xl text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" placeholder="e.g. Web Dev, Machine Learning..." list="category-list" />
                <datalist id="category-list">
                  {categories.filter(c => c !== "ALL").map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-ink mb-2">Notes (Optional)</label>
                <input value={notes} onChange={e => setNotes(e.target.value)} type="text" className="w-full px-4 py-3 border-2 border-ink rounded-xl text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" placeholder="Brief description..." />
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
              <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 md:py-4 text-ink hover:bg-bg border-2 border-transparent hover:border-ink rounded-xl font-bold uppercase tracking-widest text-xs transition-colors text-center w-full sm:w-auto">CANCEL</button>
              <button type="submit" className="px-6 py-3 md:py-4 bg-ink hover:bg-bg hover:text-ink text-bg border-2 border-ink rounded-xl font-bold uppercase tracking-widest text-xs transition-colors text-center w-full sm:w-auto">SAVE RESOURCE</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {/* Categories Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-xs md:text-sm font-extrabold uppercase tracking-widest rounded-xl transition-all border-2 whitespace-nowrap shrink-0 ${
                activeCategory === cat 
                  ? 'bg-ink text-bg border-ink shadow-[3px_3px_0px_var(--theme-ink)]' 
                  : 'bg-bg text-ink border-ink hover:bg-highlight hover:shadow-[3px_3px_0px_var(--theme-ink)] hover:-translate-y-0.5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SEARCH DIRECTORY..." 
            className="w-full pl-12 pr-4 py-3 md:py-4 bg-bg rounded-xl border-2 border-ink text-xs md:text-sm font-bold uppercase tracking-widest focus:outline-none focus:bg-highlight transition-colors"
          />
        </div>
      </div>

      {/* Directory Tree View */}
      <div className="bg-bg border-2 border-ink rounded-3xl p-4 md:p-6 shadow-[4px_4px_0px_var(--theme-ink)]">
        {Object.keys(groupedResources).length > 0 ? (
          <div className="space-y-1">
            {Object.entries(groupedResources)
              .sort(([catA], [catB]) => catA.localeCompare(catB))
              .map(([category, items]) => (
                <TreeFolder
                  key={category}
                  category={category}
                  resources={items}
                  removeResource={removeResource}
                  expanded={expandedFolders[category] ?? true}
                  toggleExpand={() => toggleFolder(category)}
                />
              ))}
          </div>
        ) : (
          <div className="py-16 text-center text-xs md:text-sm font-bold uppercase tracking-widest text-sub">
            {search ? "No matching resources found." : "Directory is empty. Add a resource!"}
          </div>
        )}
      </div>
    </div>
  );
}
