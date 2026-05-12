import { useState, useRef, useEffect } from "react";
import { useAppStore, QuickNote } from "../store";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Pin, PinOff, Search, StickyNote, Edit3, Save, X } from "lucide-react";
import { toast } from "sonner";

const NOTE_COLORS = [
  { name: "Default", value: "default", bg: "var(--theme-bg)", border: "var(--theme-ink)" },
  { name: "Lime", value: "lime", bg: "#ecfccb", border: "#65a30d", darkBg: "#1a2e05", darkBorder: "#84cc16" },
  { name: "Sky", value: "sky", bg: "#e0f2fe", border: "#0284c7", darkBg: "#082f49", darkBorder: "#38bdf8" },
  { name: "Rose", value: "rose", bg: "#ffe4e6", border: "#e11d48", darkBg: "#4c0519", darkBorder: "#fb7185" },
  { name: "Amber", value: "amber", bg: "#fef3c7", border: "#d97706", darkBg: "#451a03", darkBorder: "#fbbf24" },
  { name: "Violet", value: "violet", bg: "#ede9fe", border: "#7c3aed", darkBg: "#2e1065", darkBorder: "#a78bfa" },
];

function getNoteColors(colorValue: string, isDark: boolean) {
  const c = NOTE_COLORS.find(n => n.value === colorValue) || NOTE_COLORS[0];
  if (colorValue === "default") {
    return { bg: isDark ? '#1a1a1a' : '#ffffff', border: isDark ? '#ffffff' : '#000000' };
  }
  return {
    bg: isDark ? (c as any).darkBg || c.bg : c.bg,
    border: isDark ? (c as any).darkBorder || c.border : c.border,
  };
}

export default function Notes() {
  const { notes, addNote, updateNote, removeNote, togglePinNote, theme } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newColor, setNewColor] = useState("default");

  const isDark = theme === 'dark';

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() && !newContent.trim()) return;
    addNote({
      id: crypto.randomUUID(),
      title: newTitle.trim() || "Untitled",
      content: newContent.trim(),
      color: newColor,
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setNewTitle("");
    setNewContent("");
    setNewColor("default");
    setShowAdd(false);
    toast.success("Note saved!");
  };

  const startEdit = (note: QuickNote) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const saveEdit = () => {
    if (editingId) {
      updateNote(editingId, { title: editTitle, content: editContent });
      setEditingId(null);
      toast.success("Note updated!");
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

  const pinnedCount = filtered.filter(n => n.pinned).length;

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tighter text-ink flex items-center gap-2 md:gap-3">
            <StickyNote className="w-8 h-8 md:w-10 md:h-10 text-ink flex-shrink-0" /> QUICK NOTES
          </h1>
          <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-sub mt-1 md:mt-2">Capture ideas instantly. Synced across all devices.</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-ink hover:bg-sub text-bg px-4 md:px-6 py-3 font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-all flex justify-center items-center gap-2 border-2 border-transparent rounded-xl w-full md:w-auto hover:shadow-[4px_4px_0px_var(--theme-sub)] hover:-translate-y-1"
        >
          <Plus className="w-4 h-4" /> NEW NOTE
        </button>
      </div>

      {/* Add Note Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-highlight border-2 border-ink rounded-2xl md:rounded-3xl p-5 md:p-8 overflow-hidden shadow-[3px_3px_0px_var(--theme-ink)] md:shadow-[4px_4px_0px_var(--theme-ink)]"
            onSubmit={handleAdd}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-2">Title</label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-ink text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink"
                  placeholder="Note title (optional)"
                />
              </div>
              <div>
                <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-2">Content</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-ink text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink resize-none"
                  placeholder="Write your note here..."
                />
              </div>
              <div>
                <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-2">Color</label>
                <div className="flex gap-3">
                  {NOTE_COLORS.map((c) => {
                    const colors = getNoteColors(c.value, isDark);
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setNewColor(c.value)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          newColor === c.value ? 'scale-110 shadow-[2px_2px_0px_var(--theme-ink)]' : 'hover:scale-105'
                        }`}
                        style={{ 
                          backgroundColor: colors.bg, 
                          borderColor: newColor === c.value ? colors.border : 'transparent'
                        }}
                        title={c.name}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
              <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 text-ink hover:bg-bg border-2 border-transparent rounded-xl hover:border-ink font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-colors text-center">CANCEL</button>
              <button type="submit" className="px-6 py-3 bg-ink hover:bg-bg hover:text-ink text-bg rounded-xl border-2 border-ink font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-colors text-center">SAVE NOTE</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-ink" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="SEARCH NOTES..."
          className="w-full pl-12 pr-4 py-3 md:py-4 bg-bg rounded-xl border-2 border-ink text-[10px] md:text-[11px] font-bold uppercase tracking-widest focus:outline-none focus:bg-highlight transition-colors"
        />
      </div>

      {/* Notes Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {filtered.map((note, i) => {
            const colors = getNoteColors(note.color, isDark);
            const isEditing = editingId === note.id;

            return (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="group relative rounded-2xl md:rounded-3xl border-2 overflow-hidden shadow-[3px_3px_0px_var(--theme-ink)] md:shadow-[4px_4px_0px_var(--theme-ink)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_var(--theme-ink)] transition-all"
                style={{ backgroundColor: colors.bg, borderColor: colors.border }}
              >
                {note.pinned && (
                  <div className="absolute top-3 right-3 z-10">
                    <Pin className="w-4 h-4" style={{ color: colors.border }} />
                  </div>
                )}

                <div className="p-5 md:p-6">
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border-2 text-sm bg-bg focus:outline-none"
                        style={{ borderColor: colors.border }}
                      />
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg border-2 text-sm bg-bg focus:outline-none resize-none"
                        style={{ borderColor: colors.border }}
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingId(null)} className="p-2 hover:bg-bg/50 rounded-lg transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                        <button onClick={saveEdit} className="p-2 hover:bg-bg/50 rounded-lg transition-colors">
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-bold text-xl tracking-tight leading-tight mb-2 pr-6">{note.title}</h3>
                      {note.content && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap opacity-80 line-clamp-6">{note.content}</p>
                      )}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: colors.border + '40' }}>
                        <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-50">
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => togglePinNote(note.id)}
                            className="p-1.5 hover:bg-bg/50 rounded-lg transition-colors"
                            title={note.pinned ? "Unpin" : "Pin"}
                          >
                            {note.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => startEdit(note)}
                            className="p-1.5 hover:bg-bg/50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { removeNote(note.id); toast.info("Note deleted"); }}
                            className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center rounded-3xl border-2 border-ink border-dashed text-[11px] font-bold uppercase tracking-widest text-sub bg-bg">
          {search ? "No notes match your search." : "No notes yet. Capture your first idea!"}
        </div>
      )}
    </div>
  );
}
