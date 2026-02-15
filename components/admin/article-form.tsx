"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Calendar, Image as ImageIcon, Loader2, Plus, Save, X, Upload
} from "lucide-react";
import Editor from "./editor";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { uploadImage } from "@/app/actions/upload-image";

interface ArticleFormProps {
    isEditing?: boolean;
    initialData?: Doc<"articles"> & { authorName?: string; categoryName?: string };
}

export default function ArticleForm({ isEditing = false, initialData }: ArticleFormProps) {
    const router = useRouter();
    const categories = useQuery(api.categories.listAll);
    const createArticle = useMutation(api.articles.create);
    const updateArticle = useMutation(api.articles.update);
    const allTags = useQuery(api.articles.getAllTags); // Fetch available tags

    // For date picker
    const [scheduledDate, setScheduledDate] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: initialData?.title || "",
        slug: initialData?.slug || "",
        excerpt: initialData?.excerpt || "",
        content: initialData?.content || "",
        coverImage: initialData?.coverImage || "",
        categoryId: (initialData?.categoryId || undefined) as Id<"categories"> | undefined,
        tags: initialData?.tags || [] as string[],
        status: initialData?.status || "draft" as "draft" | "published" | "scheduled",
        source: initialData?.source || "human" as "human" | "ai",
        isFeatured: initialData?.isFeatured || false,
    });

    // Handle scheduledFor date formatting
    useEffect(() => {
        if (initialData?.scheduledFor) {
            const date = new Date(initialData.scheduledFor);
            // Format to YYYY-MM-DDTHH:MM for datetime-local
            const formatted = date.toISOString().slice(0, 16);
            setScheduledDate(formatted);
        }
    }, [initialData]);

    const [tagInput, setTagInput] = useState("");
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-generate slug from title
    useEffect(() => {
        if (!isEditing && formData.title) {
            setFormData(prev => ({
                ...prev,
                slug: formData.title
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '')
            }));
        }
    }, [formData.title, isEditing]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Strict validation for non-drafts is handled by server, but we can do basic client side checks
        if (formData.status !== 'draft') {
            if (!formData.categoryId) {
                toast.error("Category is required for publishing");
                return;
            }
            if (!formData.content) {
                toast.error("Content is required for publishing");
                return;
            }
        }

        // Check schedule date
        let scheduledTimestamp = undefined;
        if (formData.status === 'scheduled') {
            if (!scheduledDate) {
                toast.error("Please select a date and time for scheduling");
                return;
            }
            scheduledTimestamp = new Date(scheduledDate).getTime();
        }

        setIsSubmitting(true);
        try {
            if (isEditing) {
                await updateArticle({
                    id: initialData!._id,
                    ...formData,
                    categoryId: formData.categoryId as Id<"categories">,
                    scheduledFor: scheduledTimestamp,
                    content: formData.content || "", // Allow empty string for drafts
                    excerpt: formData.excerpt || "",
                    coverImage: formData.coverImage || "",
                });
                toast.success("Article updated successfully");
            } else {
                await createArticle({
                    ...formData,
                    categoryId: formData.categoryId,
                    scheduledFor: scheduledTimestamp,
                    content: formData.content || "",
                    excerpt: formData.excerpt || "",
                    coverImage: formData.coverImage || "",
                });
                toast.success("Article created successfully");
            }
            router.push("/admin/articles");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error(isEditing ? "Failed to update article" : "Failed to create article");
        } finally {
            setIsSubmitting(false);
        }
    };

    const addTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            // Handle comma separated pasting or typing
            const inputs = tagInput.split(',').map(s => s.trim()).filter(Boolean);

            setFormData(prev => {
                const newTags = [...prev.tags];
                inputs.forEach(t => {
                    if (!newTags.includes(t)) newTags.push(t);
                });
                return { ...prev, tags: newTags };
            });
            setTagInput("");
            setShowTagSuggestions(false);
        }
    };

    // Also handle pasting CSV
    const handleTagPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const paste = e.clipboardData.getData('text');
        const inputs = paste.split(',').map(s => s.trim()).filter(Boolean);

        setFormData(prev => {
            const newTags = [...prev.tags];
            inputs.forEach(t => {
                if (!newTags.includes(t)) newTags.push(t);
            });
            return { ...prev, tags: newTags };
        });
    };

    const createCategory = useMutation(api.categories.create);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: "", slug: "", description: "" });
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.name || !newCategory.slug) {
            toast.error("Name and slug are required");
            return;
        }
        setIsCreatingCategory(true);
        try {
            const id = await createCategory({
                name: newCategory.name,
                slug: newCategory.slug,
                description: newCategory.description
            });
            setFormData(prev => ({ ...prev, categoryId: id as Id<"categories"> }));
            setIsCategoryModalOpen(false);
            setNewCategory({ name: "", slug: "", description: "" });
            toast.success("Category created on-the-fly!");
        } catch (_error) {
            toast.error("Failed to create category");
        } finally {
            setIsCreatingCategory(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const url = await uploadImage(formData);
            setFormData(prev => ({ ...prev, coverImage: url }));
            toast.success("Image uploaded!");
        } catch (err) {
            console.error(err);
            toast.error("Upload failed. Ensure CLOUDINARY env vars are set.");
        } finally {
            setIsUploading(false);
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter((t: string) => t !== tagToRemove) }));
    };

    return (
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                {/* Main Content Card */}
                <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Article Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter a compelling title..."
                            className="w-full text-2xl font-serif font-bold bg-transparent border-b border-zinc-100 py-2 focus:outline-none focus:border-primary transition-colors placeholder:text-zinc-300"
                        />
                        {isEditing && initialData?.updatedAt && (
                            <div className="text-[10px] text-zinc-400 mt-2 font-mono">
                                Last edited: {new Date(initialData.updatedAt).toLocaleString()}
                                {/* Show engagement stats ONLY if editing and published */}
                                {initialData.status === 'published' && (
                                    <span className="ml-4 text-purple-600">
                                        Views: {initialData.viewCount} • Unique: {initialData.uniqueViewCount}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400">Short Excerpt {formData.status !== 'draft' && <span className="text-red-500">*</span>}</label>
                            <span className={cn(
                                "text-[10px] font-black tabular-nums transition-colors",
                                formData.excerpt.length > 225 ? "text-red-500" :
                                    formData.excerpt.length > 200 ? "text-orange-500" : "text-zinc-400"
                            )}>
                                {formData.excerpt.length} / 225
                            </span>
                        </div>
                        <textarea
                            required={formData.status !== 'draft'}
                            value={formData.excerpt}
                            onChange={e => {
                                // Limit to 225 characters as requested in bug tracker 21
                                if (e.target.value.length <= 225) {
                                    setFormData(prev => ({ ...prev, excerpt: e.target.value }));
                                }
                            }}
                            placeholder="Brief summary for indexing and cards..."
                            rows={3}
                            className="w-full resize-none bg-zinc-50 border border-zinc-100 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-zinc-600 font-medium leading-relaxed"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Rich Content</label>
                        <Editor
                            content={formData.content}
                            onChange={content => setFormData(prev => ({ ...prev, content }))}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Publishing Card */}
                <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 border-b border-zinc-50 pb-4">Status & Visibility</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Publish Status</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as "draft" | "published" | "scheduled" }))}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 font-bold text-sm outline-none appearance-none cursor-pointer hover:bg-zinc-100 transition-colors"
                            >
                                <option value="draft">Draft (Stay Hidden)</option>
                                <option value="published">Publish Now (Publicly Visible)</option>
                                <option value="scheduled">Schedule (Future Release)</option>
                            </select>
                        </div>

                        {formData.status === "scheduled" && (
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Schedule For</label>
                                <div className="relative">
                                    <input
                                        type="datetime-local"
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 font-bold text-sm outline-none"
                                    />
                                    <Calendar className="absolute right-4 top-2.5 text-zinc-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-zinc-900">Featured Article</span>
                                <span className="text-[10px] text-zinc-400 font-medium">Show in hero section</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, isFeatured: !prev.isFeatured }))}
                                className={cn(
                                    "w-10 h-5 rounded-full transition-all relative",
                                    formData.isFeatured ? "bg-primary" : "bg-zinc-300"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                                    formData.isFeatured ? "left-6" : "left-1"
                                )} />
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        {isEditing ? "Update Article" : "Publish Article"}
                    </button>
                </div>

                {/* Organization Card */}
                <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 border-b border-zinc-50 pb-4">Categorization</h3>

                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400">Primary Category</label>
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryModalOpen(true)}
                                    className="text-[10px] font-black uppercase text-primary hover:underline"
                                >
                                    + Create New
                                </button>
                            </div>
                            <select
                                required
                                value={formData.categoryId}
                                onChange={e => setFormData(prev => ({ ...prev, categoryId: (e.target.value || undefined) as Id<"categories"> | undefined }))}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 font-bold text-sm outline-none appearance-none cursor-pointer"
                            >
                                <option value="">Select Category</option>
                                {categories?.map(cat => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Category Modal Overlay */}
                        {isCategoryModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                                <div className="bg-white p-8 rounded-3xl shadow-2xl border border-zinc-100 max-w-md w-full relative">
                                    <button
                                        onClick={() => setIsCategoryModalOpen(false)}
                                        className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-600"
                                    >
                                        <X size={20} />
                                    </button>
                                    <h2 className="text-xl font-serif font-black text-zinc-900 mb-6">New Category</h2>
                                    <form onSubmit={handleCreateCategory} className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Category Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={newCategory.name}
                                                onChange={e => {
                                                    const name = e.target.value;
                                                    setNewCategory(prev => ({
                                                        ...prev,
                                                        name,
                                                        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                                                    }));
                                                }}
                                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none"
                                                placeholder="e.g. Science & Tech"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Slug</label>
                                            <input
                                                type="text"
                                                required
                                                value={newCategory.slug}
                                                onChange={e => setNewCategory(prev => ({ ...prev, slug: e.target.value }))}
                                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Description (Optional)</label>
                                            <textarea
                                                value={newCategory.description}
                                                onChange={e => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none"
                                                rows={2}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isCreatingCategory}
                                            className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-all disabled:opacity-50"
                                        >
                                            {isCreatingCategory ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                            Create Category
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">SEO Slug</label>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 font-mono text-xs focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Metadata Tags</label>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={e => {
                                        setTagInput(e.target.value);
                                        setShowTagSuggestions(true);
                                    }}
                                    onKeyDown={addTag}
                                    onPaste={handleTagPaste}
                                    placeholder="Add tags (comma separated)..."
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none"
                                />
                                {showTagSuggestions && tagInput && (
                                    <div className="absolute z-10 bg-white border border-zinc-200 rounded-xl shadow-lg w-full mt-1 p-2 max-h-40 overflow-y-auto">
                                        {allTags?.filter((t: string) => t.toLowerCase().includes(tagInput.toLowerCase()) && !formData.tags.includes(t)).map((t: string) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, tags: [...prev.tags, t] }));
                                                    setTagInput("");
                                                    setShowTagSuggestions(false);
                                                }}
                                                className="block w-full text-left px-3 py-1.5 hover:bg-zinc-50 rounded-lg text-xs"
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {formData.tags.map((tag: string) => (
                                        <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                            {tag}
                                            <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Media Card */}
                <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 border-b border-zinc-50 pb-4">Cover Media</h3>

                    <div className="space-y-4">
                        <div className="aspect-video bg-zinc-100 rounded-2xl overflow-hidden relative border border-zinc-200 group">
                            {formData.coverImage ? (
                                <>
                                    <Image src={formData.coverImage} alt="Cover" fill className="object-cover" />
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, coverImage: "" }))}
                                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={14} />
                                    </button>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400">
                                    <ImageIcon size={32} strokeWidth={1.5} />
                                    <span className="text-[10px] font-black uppercase mt-2">No Image Selected</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Image URL</label>
                            <input
                                type="text"
                                value={formData.coverImage}
                                onChange={e => setFormData(prev => ({ ...prev, coverImage: e.target.value }))}
                                placeholder="Paste Cloudinary or Unsplash URL..."
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none"
                            />
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-[10px] text-zinc-400 font-bold uppercase">OR</span>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleUpload}
                                    className="hidden"
                                    accept="image/*"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-xs font-bold text-zinc-600 transition-colors"
                                >
                                    {isUploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                                    Upload from PC
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
