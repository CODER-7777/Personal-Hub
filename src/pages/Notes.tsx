import React, { useState } from "react";
import { useAppStore, QuickNote } from "../store";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Pin, PinOff, Search, FileText, Edit3, Save, X, Maximize2 } from "lucide-react";
import { toast } from "sonner";

export default function Notes() {
  const { notes, addNote, updateNote, removeNote, togglePinNote } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  
  // Expanded view / Edit state
  const [expandedNote, setExpandedNote] = useState<QuickNote | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() && !newContent.trim()) return;
    addNote({
      id: crypto.randomUUID(),
      title: newTitle.trim() || "Untitled Document",
      content: newContent.trim(),
      color: "default",
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setNewTitle("");
    setNewContent("");
    setShowAdd(false);
    toast.success("Document saved.");
  };

  const openExpanded = (note: QuickNote) => {
    setExpandedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const closeExpanded = () => {
    setExpandedNote(null);
  };

  const saveExpanded = () => {
    if (expandedNote) {
      updateNote(expandedNote.id, { title: editTitle, content: editContent });
      toast.success("Document updated.");
      // Update local state to reflect changes without closing immediately
      setExpandedNote({ ...expandedNote, title: editTitle, content: editContent, updatedAt: new Date().toISOString() });
    }
  };

  const filtered = notes
    .filter(n =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-6 md:space-y-8 relative">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold uppercase tracking-tighter text-ink flex items-center gap-2 md:gap-3">
            <FileText className="w-8 h-8 md:w-10 md:h-10 text-ink flex-shrink-0" /> DOCUMENTS
          </h1>
          <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-sub mt-1 md:mt-2">Formal notes and documents. Synced securely.</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-ink hover:bg-sub text-bg px-4 md:px-6 py-3 font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-all flex justify-center items-center gap-2 border-2 border-transparent rounded-xl w-full md:w-auto hover:shadow-[4px_4px_0px_var(--theme-sub)] hover:-translate-y-1"
        >
          <Plus className="w-4 h-4" /> NEW DOCUMENT
        </button>
      </div>

      {/* Add Note Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-bg border-2 border-ink rounded-xl p-5 md:p-8 overflow-hidden shadow-[4px_4px_0px_var(--theme-ink)]"
            onSubmit={handleAdd}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-2">Document Title</label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-ink text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink font-serif"
                  placeholder="Untitled Document"
                />
              </div>
              <div>
                <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-2">Content</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border-2 border-ink text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink resize-none font-serif leading-relaxed"
                  placeholder="Begin drafting..."
                />
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
              <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 text-ink hover:bg-highlight border-2 border-transparent rounded-lg hover:border-ink font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-colors text-center">CANCEL</button>
              <button type="submit" className="px-6 py-3 bg-ink hover:bg-highlight hover:text-ink text-bg rounded-lg border-2 border-ink font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-colors text-center">SAVE DOCUMENT</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-sub" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="SEARCH DOCUMENTS..."
          className="w-full pl-12 pr-4 py-3 md:py-4 bg-line rounded-xl border-2 border-transparent focus:border-ink text-[10px] md:text-[11px] font-bold uppercase tracking-widest focus:outline-none transition-colors"
        />
      </div>

      {/* Notes Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
          {filtered.map((note, i) => (
            <motion.div
              key={note.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => openExpanded(note)}
              className="group relative rounded-xl border-2 border-ink overflow-hidden shadow-[3px_3px_0px_var(--theme-ink)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_var(--theme-ink)] transition-all bg-bg cursor-pointer flex flex-col h-64"
            >
              {note.pinned && (
                <div className="absolute top-4 right-4 z-10 text-ink">
                  <Pin className="w-4 h-4" />
                </div>
              )}

              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-bold text-lg tracking-tight leading-tight mb-3 pr-6 font-serif border-b-2 border-line pb-2">{note.title}</h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap opacity-80 line-clamp-5 font-serif flex-1">
                  {note.content || "Empty document."}
                </p>
                <div className="flex items-center justify-between mt-4 pt-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-sub">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                     <Maximize2 className="w-4 h-4 text-sub group-hover:text-ink transition-colors" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-2xl border-2 border-ink border-dashed text-[11px] font-bold uppercase tracking-widest text-sub bg-bg">
          {search ? "No documents match your search." : "No documents yet. Create your first draft."}
        </div>
      )}

      {/* Expanded Note Modal */}
      <AnimatePresence>
        {expandedNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              onClick={closeExpanded}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-bg border-4 border-ink rounded-2xl shadow-[8px_8px_0px_var(--theme-ink)] flex flex-col overflow-hidden z-10"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b-2 border-ink bg-line">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => togglePinNote(expandedNote.id)}
                    className={`p-2 rounded-lg border-2 transition-colors ${expandedNote.pinned ? 'bg-ink text-bg border-ink' : 'bg-bg text-ink border-transparent hover:border-ink'}`}
                    title={expandedNote.pinned ? "Unpin Document" : "Pin Document"}
                  >
                    {expandedNote.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  </button>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-sub">
                    LAST EDITED: {new Date(expandedNote.updatedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                   <button
                    onClick={() => { removeNote(expandedNote.id); closeExpanded(); toast.info("Document deleted"); }}
                    className="p-2 bg-bg text-red-500 hover:bg-red-500 hover:text-white border-2 border-transparent hover:border-red-500 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">Delete</span>
                  </button>
                  <button onClick={closeExpanded} className="p-2 bg-bg text-ink border-2 border-ink hover:bg-ink hover:text-bg rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col gap-6">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-2xl md:text-4xl font-extrabold tracking-tighter text-ink bg-transparent focus:outline-none border-b-2 border-transparent focus:border-line pb-2 font-serif"
                  placeholder="Document Title"
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full flex-1 min-h-[300px] text-base md:text-lg text-ink bg-transparent focus:outline-none resize-none font-serif leading-loose"
                  placeholder="Draft your document content here..."
                />
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t-2 border-ink bg-line flex justify-end">
                 <button onClick={saveExpanded} className="px-8 py-4 bg-ink text-bg rounded-lg border-2 border-ink font-bold uppercase tracking-widest text-[11px] transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_var(--theme-sub)] flex items-center gap-2">
                    <Save className="w-4 h-4" /> SAVE CHANGES
                  </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
