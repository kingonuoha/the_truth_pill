"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Plus, Edit2, Trash2, Folder, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Doc, Id } from "@/convex/_generated/dataModel";

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
            description: "Articles will not be deleted, but they will be uncategorized.",
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
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-zinc-900">Categories</h1>
                    <p className="text-zinc-500 mt-1 uppercase text-[10px] font-black tracking-widest">Organize your truth by topics.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus size={20} />
                    New Category
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat: CategoryWithCount) => (
                    <div key={cat._id} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-primary border border-zinc-100 group-hover:bg-primary group-hover:text-white transition-colors">
                                <Folder size={24} />
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(cat)} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(cat._id)} className="p-2 hover:bg-red-50 rounded-lg text-zinc-400 hover:text-red-600 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <h3 className="font-serif font-bold text-xl text-zinc-900">{cat.name}</h3>
                        <p className="text-sm text-zinc-500 mt-2 line-clamp-2 min-h-[40px]">{cat.description || "No description provided."}</p>
                        <div className="mt-6 pt-6 border-t border-zinc-50 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Articles</span>
                            <span className="text-sm font-black text-primary">{cat.articleCount || 0}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-serif font-bold text-zinc-900 mb-6">
                            {editingCategory ? "Update Category" : "Create Category"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Category Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') }))}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="e.g., Hidden History"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Slug</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.slug}
                                    onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 font-mono text-xs focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none"
                                    rows={3}
                                    placeholder="What's this topic about?"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 text-sm font-black uppercase tracking-widest hover:bg-zinc-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-3 rounded-xl bg-primary text-white text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? "Saving..." : "Save Topic"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
