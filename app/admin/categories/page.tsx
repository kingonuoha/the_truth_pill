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
        <div className="space-y-10 pb-12 font-sans text-gray-950">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black tracking-tight">Taxonomy</h1>
                    <p className="text-gray-500 mt-1 font-medium font-sans">Organize your truth and define the knowledge structure.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95 shadow-lg shadow-blue-100"
                >
                    <Plus size={20} />
                    New Taxonomy
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories.map((cat: CategoryWithCount) => (
                    <div key={cat._id} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-xl hover:shadow-gray-200 transition-all duration-500 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                        <div className="flex items-start justify-between mb-6 relative z-10">
                            <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-6 transition-all duration-500">
                                <Folder size={24} />
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                                <button
                                    onClick={() => handleEdit(cat)}
                                    className="p-2.5 bg-gray-50 text-gray-400 hover:bg-white hover:text-blue-600 hover:shadow-sm rounded-xl border border-transparent hover:border-gray-100 transition-all active:scale-90"
                                    title="Edit Topic"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(cat._id)}
                                    className="p-2.5 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-xl border border-transparent transition-all active:scale-90"
                                    title="Delete Topic"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <h3 className="font-serif font-black text-2xl tracking-tight mb-2 group-hover:text-blue-600 transition-colors">{cat.name}</h3>
                            <p className="text-[13px] text-gray-500 leading-relaxed font-medium min-h-[40px] line-clamp-2">{cat.description || "No classification details provided for this taxonomy."}</p>

                            <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Structure</span>
                                    <span className="text-xs font-bold text-gray-500 font-mono mt-0.5">/{cat.slug}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-lg font-black text-blue-600 tabular-nums leading-none">{cat.articleCount || 0}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1">Artifacts</span>
                                </div>
                            </div>
                        </div>
                    </div>
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
                            className="bg-white w-full max-w-lg rounded-2xl p-10 shadow-[0_30px_100px_rgba(0,0,0,0.25)] relative z-10 overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-purple-600" />

                            <h2 className="text-3xl font-serif font-black text-gray-950 mb-8 tracking-tight">
                                {editingCategory ? "Update Taxonomy" : "New Taxonomy"}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Identity</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') }))}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all placeholder:text-gray-300"
                                            placeholder="e.g., Hidden History"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Path Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.slug}
                                            onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 font-mono text-xs text-blue-600 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Definition</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all resize-none min-h-[120px] placeholder:text-gray-300"
                                        placeholder="What is the essence of this knowledge branch?"
                                    />
                                </div>
                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-6 py-4 rounded-xl border border-gray-200 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all active:scale-95"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-[2] px-6 py-4 rounded-xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-100 active:scale-95 flex items-center justify-center gap-2"
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
