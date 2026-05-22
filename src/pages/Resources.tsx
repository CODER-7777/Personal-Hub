import React, { useState } from "react";
import { useAppStore, Resource } from "../store";
import { motion } from "motion/react";
import { Plus, Trash2, ExternalLink, Search } from "lucide-react";

export default function Resources() {
  const { resources, addResource, removeResource } = useAppStore();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");

  const filtered = resources.filter(
    (r) => r.title.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;
    addResource({
      id: crypto.randomUUID(),
      title,
      url,
      category: category || "Uncategorized",
    });
    setTitle("");
    setUrl("");
    setCategory("");
    setShowAdd(false);
  };

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-4 md:space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold uppercase tracking-tighter text-ink mb-1 md:mb-2">RESOURCES</h1>
          <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-sub">Stash your useful links and notes here.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-ink hover:bg-sub text-bg px-4 md:px-6 py-3 font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-all flex justify-center items-center gap-2 border-2 border-transparent hover:shadow-[4px_4px_0px_var(--theme-sub)] hover:-translate-y-1 rounded-xl w-full md:w-auto mt-2 md:mt-0"
        >
          <Plus className="w-4 h-4" /> ADD LINK
        </button>
      </div>

      {showAdd && (
        <motion.form 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-highlight border-2 border-ink rounded-2xl md:rounded-3xl p-5 md:p-8 overflow-hidden shadow-[3px_3px_0px_var(--theme-ink)] md:shadow-[4px_4px_0px_var(--theme-ink)]"
          onSubmit={handleAdd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div>
              <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">Title</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} type="text" className="w-full px-4 py-3 border-2 border-ink rounded-xl text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" placeholder="e.g. React Docs" />
            </div>
            <div>
              <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">URL</label>
              <input required value={url} onChange={e => setUrl(e.target.value)} type="url" className="w-full px-4 py-3 border-2 border-ink rounded-xl text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">Category</label>
              <input value={category} onChange={e => setCategory(e.target.value)} type="text" className="w-full px-4 py-3 border-2 border-ink rounded-xl text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" placeholder="e.g. Web Dev" />
            </div>
          </div>
          <div className="mt-4 md:mt-6 flex flex-col sm:flex-row justify-end gap-3">
            <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 text-ink hover:bg-bg border-2 border-transparent hover:border-ink rounded-xl font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-colors text-center w-full sm:w-auto">CANCEL</button>
            <button type="submit" className="px-6 py-3 bg-ink hover:bg-bg hover:text-ink text-bg border-2 border-ink rounded-xl font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-colors text-center w-full sm:w-auto">SAVE</button>
          </div>
        </motion.form>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-ink" />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="SEARCH RESOURCES..." 
          className="w-full pl-12 pr-4 py-3 md:py-4 bg-bg rounded-xl border-2 border-ink text-[10px] md:text-[11px] font-bold uppercase tracking-widest focus:outline-none focus:bg-highlight transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filtered.map(res => (
          <motion.div 
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={res.id} 
            className="bg-bg group p-6 flex flex-col hover:bg-highlight transition-all relative border-2 border-ink rounded-3xl shadow-[4px_4px_0px_var(--theme-ink)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_var(--theme-ink)]"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-ink bg-line border-2 border-ink rounded-lg px-2 py-1">{res.category}</span>
              <button onClick={() => removeResource(res.id)} className="text-sub hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <h3 className="font-bold text-ink text-lg tracking-tight leading-none mb-4 line-clamp-1">{res.title}</h3>
            <div className="mt-auto">
                <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-widest text-ink flex items-center gap-1 line-clamp-1 w-fit bg-line px-3 py-2 border-2 border-transparent rounded-lg hover:border-ink transition-colors">
                VISIT LINK <ExternalLink className="w-3 h-3" />
                </a>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center rounded-3xl border-2 border-ink border-dashed text-[11px] font-bold uppercase tracking-widest text-sub bg-bg">
            No resources found. Try adding some!
          </div>
        )}
      </div>
    </div>
  );
}
