"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Plus, Edit2, Trash2, Folder, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { AnimatePresence, motion } from "framer-motion";

type CategoryWithCount = Doc<"categories"> & { articleCount: number };

export default function CategoriesPage() {
    const categories = useQuery(api.categories.listAll);
    const removeCategory = useMutation(api.categories.remove);
    const createCategory = useMutation(api.categories.create);
    const updateCategory = useMutation(api.categories.update);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        coverImage: ""
    });

    const resetForm = () => {
        setFormData({ name: "", slug: "", description: "", coverImage: "" });
        setEditingCategory(null);
    };

    const handleEdit = (cat: CategoryWithCount) => {
        setEditingCategory(cat);
        setFormData({
            name: cat.name,
            slug: cat.slug,
            description: cat.description || "",
            coverImage: cat.coverImage || ""
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingCategory) {
                await updateCategory({
                    id: editingCategory._id,
                    ...formData
                });
                toast.success("Category updated");
            } else {
                await createCategory({
                    ...formData
                });
                toast.success("Category created");
            }
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            console.error(err);
            toast.error("Operation failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: Id<"categories">) => {
        toast("Permanently remove this category?", {
            description: "Articles will remain but become uncategorized.",
            action: {
                label: "Delete",
                onClick: async () => {
                    try {
                        await removeCategory({ id });
                        toast.success("Category removed");
                    } catch (err) {
                        console.error(err);
                        toast.error("Failed to remove category");
                    }
                }
            }
        });
    };

    if (!categories) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-pulse flex flex-col items-center gap-4 text-blue-600">
                    <Loader2 className="animate-spin" size={32} />
                    <p className="text-gray-500 font-medium font-sans">Organizing topics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-20 font-sans text-gray-950 dark:text-gray-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-gray-100 dark:border-gray-800/50">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-1 h-px bg-blue-600 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">Knowledge Architecture</span>
                    </div>
                    <h1 className="text-5xl font-serif font-black tracking-tight dark:text-white leading-none">Taxonomy</h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium max-w-lg">Organize your truth and define the knowledge structure that governs the digital experience.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="group relative px-8 py-4 bg-gray-950 dark:bg-white text-white dark:text-gray-950 rounded-2xl font-black text-xs uppercase tracking-[0.15em] flex items-center gap-3 overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-blue-500/10"
                >
                    <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <Plus size={18} className="relative z-10" />
                    <span className="relative z-10 group-hover:text-white transition-colors">Establish Path</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {categories.map((cat: CategoryWithCount) => (
                    <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={cat._id}
                        className="group relative bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl rounded-3xl p-8 border border-white dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-none hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-700 overflow-hidden isolate"
                    >
                        {/* Interactive Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.03] to-purple-600/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
                        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -mr-24 -mt-24 group-hover:scale-150 transition-transform duration-1000 -z-10" />

                        <div className="flex items-center justify-between mb-8">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-600 blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                                <div className="relative w-16 h-16 rounded-[1.25rem] bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:bg-white dark:group-hover:bg-gray-950 group-hover:border-blue-100 dark:group-hover:border-blue-900/50 transition-all duration-500">
                                    <Folder size={28} strokeWidth={1.5} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                                <button
                                    onClick={() => handleEdit(cat)}
                                    className="p-3 bg-white dark:bg-gray-900 text-gray-400 hover:text-blue-600 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:scale-110 active:scale-90"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(cat._id)}
                                    className="p-3 bg-white dark:bg-gray-900 text-gray-400 hover:text-red-500 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:scale-110 active:scale-90"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-2xl font-serif font-black tracking-tight text-gray-950 dark:text-white leading-tight group-hover:translate-x-1 transition-transform duration-500">{cat.name}</h3>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600/60 dark:text-blue-400/60">Path:</span>
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 font-mono tracking-tighter">tp://truthpill.org/{cat.slug}</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium line-clamp-2 italic opacity-80">
                                {cat.description || "The conceptual boundaries for this branch of truth have not yet been defined by an architect."}
                            </p>
                        </div>

                        <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800/50 flex items-center justify-between group/footer">
                            <div className="space-y-1">
                                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 group-hover:text-blue-600 transition-colors duration-500">Classification</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                    <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-wider italic">Level 01 Entry</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-3xl font-serif font-black text-gray-950 dark:text-white tabular-nums leading-none group-hover:scale-110 transition-transform duration-500">{cat.articleCount || 0}</span>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-300 dark:text-gray-700 mt-2">Active Artifacts</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-gray-950/60 backdrop-blur-[8px]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-cardw-full max-w-lg rounded-2xl p-10 shadow-[0_30px_100px_rgba(0,0,0,0.25)] dark:shadow-[0_30px_100px_rgba(0,0,0,0.5)] border border-transparent dark:border-zinc-800 relative z-10 overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-purple-600" />

                            <h2 className="text-3xl font-serif font-black text-gray-950 dark:text-white mb-8 tracking-tight">
                                {editingCategory ? "Update Taxonomy" : "New Taxonomy"}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-zinc-500">Identity</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') }))}
                                            className="w-full bg-gray-50 dark:bg-background-800 border border-gray-100 dark:border-zinc-700 rounded-xl px-4 py-3.5 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all placeholder:text-gray-300 dark:placeholder:text-zinc-600 dark:text-white"
                                            placeholder="e.g., Hidden History"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-zinc-500">Path Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.slug}
                                            onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                            className="w-full bg-gray-50 dark:bg-background-800 border border-gray-100 dark:border-zinc-700 rounded-xl px-4 py-3.5 font-mono text-xs text-blue-600 dark:text-blue-400 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all placeholder:text-gray-300 dark:placeholder:text-zinc-600"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-zinc-500">Definition</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full bg-gray-50 dark:bg-background-800 border border-gray-100 dark:border-zinc-700 rounded-xl px-4 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all resize-none min-h-[120px] placeholder:text-gray-300 dark:placeholder:text-zinc-600 dark:text-white"
                                        placeholder="What is the essence of this knowledge branch?"
                                    />
                                </div>
                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-6 py-4 rounded-xl border border-gray-200 dark:border-zinc-700 text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all active:scale-95"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-[2] px-6 py-4 rounded-xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-100 dark:shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                                        {editingCategory ? "Synchronize" : "Establish Branch"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
