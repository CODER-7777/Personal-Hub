import React, { useState, useMemo } from "react";
import { useAppStore, Resource } from "../store";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, ExternalLink, Search, Folder, FolderOpen, File as FileIcon, ChevronRight, ChevronDown } from "lucide-react";

const FolderCard: React.FC<{ 
  category: string;
  count: number;
  onClick: () => void; 
}> = ({ 
  category, 
  count, 
  onClick 
}) => {
  return (
    <button 
      onClick={onClick}
      className="bg-line border-2 border-ink rounded-3xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-highlight hover:-translate-y-1 hover:shadow-[4px_4px_0px_var(--theme-ink)] transition-all group aspect-square"
    >
      <div className="p-4 bg-bg rounded-2xl border-2 border-ink group-hover:scale-110 transition-transform">
        <Folder className="w-8 h-8 text-ink" />
      </div>
      <div className="text-center w-full">
        <h3 className="font-extrabold uppercase tracking-widest text-ink text-sm md:text-base truncate">{category}</h3>
        <p className="text-[10px] font-bold text-sub uppercase tracking-widest mt-1 bg-bg inline-block px-2 py-0.5 rounded-md border-2 border-ink">{count} items</p>
      </div>
    </button>
  );
};

export default function Resources() {
  const { resources, addResource, removeResource } = useAppStore();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");

  const filtered = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || 
                          r.category.toLowerCase().includes(search.toLowerCase()) ||
                          (r.notes && r.notes.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = activeCategory === "ALL" || r.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = useMemo(() => {
    const cats = new Set(resources.map(r => r.category));
    return ["ALL", ...Array.from(cats)].sort();
  }, [resources]);

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

      {/* Directory Grid / Folder Content View */}
      <div className="bg-bg border-2 border-ink rounded-3xl p-4 md:p-6 shadow-[4px_4px_0px_var(--theme-ink)]">
        {activeFolder ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-ink">
              <button 
                onClick={() => setActiveFolder(null)}
                className="p-2 hover:bg-highlight border-2 border-transparent hover:border-ink rounded-xl transition-colors"
              >
                <ChevronRight className="w-6 h-6 rotate-180" />
              </button>
              <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-widest flex items-center gap-3">
                <FolderOpen className="w-6 h-6 text-ink" /> {activeFolder}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groupedResources[activeFolder]?.map((res) => (
                <div 
                  key={res.id} 
                  className="flex flex-col justify-between bg-line border-2 border-ink p-4 rounded-2xl hover:shadow-[4px_4px_0px_var(--theme-ink)] hover:-translate-y-1 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 bg-bg border-2 border-ink rounded-xl shrink-0 group-hover:bg-highlight transition-colors">
                        <FileIcon className="w-5 h-5 text-ink" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm md:text-base text-ink truncate block w-full">{res.title}</h4>
                        {res.notes && <p className="text-xs font-bold text-sub truncate uppercase tracking-widest">{res.notes}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 border-t-2 border-ink border-dashed pt-3">
                    <a 
                      href={res.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex-1 py-2 px-3 text-center bg-ink text-bg font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-sub transition-colors flex items-center justify-center gap-2"
                    >
                      Open Link <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button 
                      onClick={() => removeResource(res.id)} 
                      className="p-2 text-sub hover:text-bg hover:bg-red-500 hover:border-red-500 border-2 border-transparent rounded-xl transition-all"
                      title="Delete Resource"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : Object.keys(groupedResources).length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Object.entries(groupedResources)
              .sort(([catA], [catB]) => catA.localeCompare(catB))
              .map(([category, items]) => (
                <FolderCard
                  key={category}
                  category={category}
                  count={(items as any[]).length}
                  onClick={() => setActiveFolder(category)}
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
