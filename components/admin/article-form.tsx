"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Calendar, Image as ImageIcon, Loader2, Save, X, Upload
} from "lucide-react";
import dynamic from "next/dynamic";
const Editor = dynamic(() => import("./editor"), {
    ssr: false,
    loading: () => <div className="h-[600px] bg-zinc-50 dark:bg-cardanimate-pulse rounded-2xl flex items-center justify-center text-zinc-400 dark:text-zinc-600 font-black uppercase tracking-widest text-xs border border-zinc-100 dark:border-zinc-800">Initializing Premium Editor...</div>
});
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { uploadImage } from "@/app/actions/upload-image";
import { useSession } from "next-auth/react";

interface ArticleFormProps {
    isEditing?: boolean;
    initialData?: Doc<"articles"> & { authorName?: string; categoryName?: string };
}

export default function ArticleForm({ isEditing = false, initialData }: ArticleFormProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const categories = useQuery(api.categories.listAll);
    const createArticle = useMutation(api.articles.create);
    const updateArticle = useMutation(api.articles.update);

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
        metaTitle: initialData?.metaTitle || "",
        metaDescription: initialData?.metaDescription || "",
        focusKeyword: initialData?.focusKeyword || "",
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
    const [isUploading, setIsUploading] = useState(false);
    const [charCount, setCharCount] = useState(0);
    const [readabilityScore, setReadabilityScore] = useState(0);
    const [headingStructure, setHeadingStructure] = useState<{ hasH2: boolean; multipleH1: boolean }>({ hasH2: false, multipleH1: false });
    const [missingAltCount, setMissingAltCount] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Readability and Heading Analysis
    useEffect(() => {
        if (!formData.content) {
            setReadabilityScore(0);
            setHeadingStructure({ hasH2: false, multipleH1: false });
            setMissingAltCount(0);
            return;
        }

        const text = formData.content.replace(/<[^>]*>/g, ' ');
        const words = text.split(/\s+/).filter(Boolean).length;
        const sentences = text.split(/[.!?]+/).filter(Boolean).length;

        // Simple Flesch-Kincaid proxy (Standard readability score)
        // We'll use word length as a proxy for syllables
        const avgSentenceLength = words / (sentences || 1);
        const avgWordLength = text.length / (words || 1);

        // Mocked Flesch Score
        const score = Math.max(0, Math.min(100, 100 - (avgSentenceLength * 0.5) - (avgWordLength * 5)));
        setReadabilityScore(Math.round(score));

        // Heading Analysis
        const hasH2 = formData.content.includes('<h2');
        const h1Count = (formData.content.match(/<h1/g) || []).length;
        setHeadingStructure({ hasH2, multipleH1: h1Count > 1 });

        // Alt Text Check
        const parser = new DOMParser();
        const doc = parser.parseFromString(formData.content, 'text/html');
        const images = doc.querySelectorAll('img');
        let missingAlt = 0;
        images.forEach(img => {
            if (!img.getAttribute('alt') || img.getAttribute('alt')?.trim() === '') {
                missingAlt++;
            }
        });
        setMissingAltCount(missingAlt);
    }, [formData.content]);

    const [isMetaTitleTouched, setIsMetaTitleTouched] = useState(false);
    const [isMetaDescriptionTouched, setIsMetaDescriptionTouched] = useState(false);
    const [isFocusKeywordTouched, setIsFocusKeywordTouched] = useState(false);
    const [isExcerptTouched, setIsExcerptTouched] = useState(false);

    // Auto-generate slug and sync fields
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

    // Sync Title -> Meta Title
    useEffect(() => {
        if (!isMetaTitleTouched && formData.title) {
            setFormData(prev => ({
                ...prev,
                metaTitle: formData.title.length > 60 ? formData.title.substring(0, 57) + "..." : formData.title
            }));
        }
    }, [formData.title, isMetaTitleTouched]);

    // Sync Excerpt <-> Meta Description
    useEffect(() => {
        if (!isMetaDescriptionTouched && formData.excerpt) {
            setFormData(prev => ({ ...prev, metaDescription: formData.excerpt }));
        }
    }, [formData.excerpt, isMetaDescriptionTouched]);

    useEffect(() => {
        if (!isExcerptTouched && formData.metaDescription) {
            setFormData(prev => ({ ...prev, excerpt: formData.metaDescription.substring(0, 225) }));
        }
    }, [formData.metaDescription, isExcerptTouched]);

    // Sync Tags -> Focus Keyword
    useEffect(() => {
        if (!isFocusKeywordTouched && formData.tags.length > 0) {
            setFormData(prev => ({ ...prev, focusKeyword: formData.tags[0] }));
        }
    }, [formData.tags, isFocusKeywordTouched]);

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

            // Content Requirements
            if (charCount < 800) {
                toast.error(`Character count is too low (${charCount}/800). Minimum 800 characters required for publication.`);
                return;
            }
            if (!headingStructure.hasH2) {
                toast.error("At least one H2 subheading is required for SEO structure.");
                return;
            }
            if (headingStructure.multipleH1) {
                toast.error("Multiple H1 tags detected. Only one H1 is recommended for SEO.");
                return;
            }
            if (missingAltCount > 0) {
                toast.error(`${missingAltCount} images are missing ALT text. This is required for SEO.`);
                return;
            }

            // SEO Metadata
            if (!formData.metaTitle) {
                toast.error("Meta Title is required for publishing");
                return;
            }
            if (!formData.metaDescription) {
                toast.error("Meta Description is required for publishing");
                return;
            }
            if (formData.metaDescription.length > 255) {
                toast.error("Meta Description must be 255 characters or less");
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
                    title: formData.title,
                    slug: formData.slug,
                    excerpt: formData.excerpt,
                    content: formData.content,
                    coverImage: formData.coverImage || "",
                    categoryId: formData.categoryId as Id<"categories">,
                    tags: formData.tags,
                    status: formData.status,
                    source: formData.source,
                    isFeatured: formData.isFeatured,
                    metaTitle: formData.metaTitle,
                    metaDescription: formData.metaDescription,
                    focusKeyword: formData.focusKeyword,
                    adminEmail: session?.user?.email || undefined,
                    scheduledFor: scheduledTimestamp,
                });
                toast.success("Article updated successfully");
            } else {
                await createArticle({
                    title: formData.title,
                    slug: formData.slug,
                    excerpt: formData.excerpt,
                    content: formData.content,
                    coverImage: formData.coverImage || "",
                    categoryId: formData.categoryId,
                    tags: formData.tags,
                    status: formData.status,
                    source: formData.source,
                    isFeatured: formData.isFeatured,
                    metaTitle: formData.metaTitle,
                    metaDescription: formData.metaDescription,
                    focusKeyword: formData.focusKeyword,
                    adminEmail: session?.user?.email || undefined,
                    scheduledFor: scheduledTimestamp,
                });
                toast.success("Article created successfully");
            }
            router.push("/admin/articles");
            router.refresh();
        } catch (error: unknown) {
            console.error(error);
            // Handle Convex validation errors
            const errorMessage = error instanceof Error ? error.message : (isEditing ? "Failed to update article" : "Failed to create article");
            toast.error(errorMessage);
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
            // setShowTagSuggestions(false); // This state variable is not defined
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
        } catch (error: unknown) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "Failed to create category";
            toast.error(errorMessage);
        } finally {
            setIsCreatingCategory(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const uploadData = new FormData();
            uploadData.append("file", file);
            const url = await uploadImage(uploadData);
            setFormData(prev => ({ ...prev, coverImage: url }));
            toast.success("Image uploaded!");
        } catch (error: unknown) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "Something went wrong";
            toast.error(errorMessage);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter((t: string) => t !== tagToRemove) }));
    };

    const [activeTab, setActiveTab] = useState<"general" | "advanced">("general");

    const categoryModal = isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={() => !isCreatingCategory && setIsCategoryModalOpen(false)} />
            <div className="relative bg-white dark:bg-card w-full max-w-md rounded-3xl shadow-2xl border border-zinc-200 dark:border-white/5 p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-serif font-bold text-zinc-900 dark:text-zinc-100">New Category</h3>
                    {!isCreatingCategory && (
                        <button onClick={() => setIsCategoryModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                            <X size={20} />
                        </button>
                    )}
                </div>

                <form onSubmit={handleCreateCategory} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Category Name</label>
                        <input
                            type="text"
                            value={newCategory.name}
                            onChange={e => {
                                const name = e.target.value;
                                const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                setNewCategory(prev => ({ ...prev, name, slug }));
                            }}
                            className="w-full bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-3 font-bold text-sm outline-none dark:text-zinc-100 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="e.g., Psychology"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Category Slug</label>
                        <input
                            type="text"
                            value={newCategory.slug}
                            onChange={e => setNewCategory(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }))}
                            className="w-full bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-3 font-bold text-sm outline-none dark:text-zinc-100 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="psychology"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isCreatingCategory || !newCategory.name || !newCategory.slug}
                        className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-all disabled:opacity-50"
                    >
                        {isCreatingCategory ? <Loader2 className="animate-spin" size={18} /> : "Create Category"}
                    </button>
                </form>
            </div>
        </div>
    );

    return (
        <>
            {categoryModal}
            <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Tabs Header */}
                    <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-background-800/50 rounded-2xl w-fit">
                        <button
                            type="button"
                            onClick={() => setActiveTab("general")}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                activeTab === "general" ? "bg-white dark:bg-background-800 text-primary shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                            )}
                        >
                            General
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("advanced")}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                activeTab === "advanced" ? "bg-white dark:bg-background-800 text-primary shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                            )}
                        >
                            Advanced
                        </button>
                    </div>

                    {activeTab === "general" ? (
                        <div className="bg-white dark:bg-card p-8 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-6">
                            {/* Article Title */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Article Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Enter a compelling title..."
                                    className="w-full bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/5 rounded-2xl px-6 py-4 text-xl font-serif font-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-zinc-100 dark:placeholder:text-zinc-600"
                                />
                                {isEditing && initialData?.updatedAt && (
                                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 font-mono">
                                        Last edited: {new Date(initialData.updatedAt).toLocaleString()}
                                        {initialData.status === 'published' && (
                                            <span className="ml-4 text-purple-600">
                                                Views: {initialData.viewCount} • Unique: {initialData.uniqueViewCount}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Excerpt */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Short Excerpt {formData.status !== 'draft' && <span className="text-red-500">*</span>}</label>
                                    <span className={cn(
                                        "text-[10px] font-black tabular-nums transition-colors",
                                        formData.excerpt.length > 225 ? "text-red-500" :
                                            formData.excerpt.length > 200 ? "text-orange-500" : "text-zinc-400 dark:text-zinc-500"
                                    )}>
                                        {formData.excerpt.length} / 225
                                    </span>
                                </div>
                                <textarea
                                    required={formData.status !== 'draft'}
                                    value={formData.excerpt}
                                    onChange={e => {
                                        if (e.target.value.length <= 225) {
                                            setFormData(prev => ({ ...prev, excerpt: e.target.value }));
                                            setIsExcerptTouched(true);
                                        }
                                    }}
                                    placeholder="Brief summary for indexing and cards..."
                                    rows={4}
                                    maxLength={225}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/5 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none dark:text-zinc-100 dark:placeholder:text-zinc-600"
                                />
                            </div>

                            {/* Editor */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Rich Content</label>
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider",
                                            charCount >= 800 ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" : "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                                        )}>
                                            <span className="tabular-nums">{charCount}</span> / 800 Characters
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider",
                                            readabilityScore > 60 ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                        )}>
                                            Score: {readabilityScore < 30 ? 'High Complexity' : readabilityScore < 60 ? 'Moderate' : 'Readable'} ({readabilityScore})
                                        </div>
                                    </div>
                                </div>
                                <Editor
                                    content={formData.content}
                                    onChange={content => setFormData(prev => ({ ...prev, content }))}
                                    onLengthChange={setCharCount}
                                />
                                <div className="mt-4 flex flex-wrap gap-4">
                                    <div className={cn("flex items-center gap-2 text-[10px] font-bold uppercase", headingStructure.hasH2 ? "text-green-600" : "text-zinc-400 dark:text-zinc-500")}>
                                        <div className={cn("w-2 h-2 rounded-full", headingStructure.hasH2 ? "bg-green-500" : "bg-zinc-200 dark:bg-background-700")} />
                                        At least one H2
                                    </div>
                                    <div className={cn("flex items-center gap-2 text-[10px] font-bold uppercase", headingStructure.multipleH1 ? "text-red-600" : "text-green-600")}>
                                        <div className={cn("w-2 h-2 rounded-full", headingStructure.multipleH1 ? "bg-red-500" : "bg-green-500")} />
                                        {headingStructure.multipleH1 ? "Multiple H1s alert" : "Clean Heading Hierarchy"}
                                    </div>
                                    <div className={cn("flex items-center gap-2 text-[10px] font-bold uppercase", missingAltCount === 0 ? "text-green-600" : "text-red-600")}>
                                        <div className={cn("w-2 h-2 rounded-full", missingAltCount === 0 ? "bg-green-500" : "bg-red-500")} />
                                        {missingAltCount === 0 ? "All images have Alt Text" : `${missingAltCount} images missing Alt Text`}
                                    </div>
                                </div>
                            </div>

                            {/* Cover Media - Moved inside General Tab */}
                            <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4">Cover Media</h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="aspect-video bg-zinc-100 dark:bg-background-800/50 rounded-2xl overflow-hidden relative border border-zinc-200 dark:border-zinc-700 group">
                                        {formData.coverImage ? (
                                            <>
                                                <Image src={formData.coverImage} alt="Cover" fill className="object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, coverImage: "" }))}
                                                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
                                                <ImageIcon size={32} strokeWidth={1.5} />
                                                <span className="text-[10px] font-black uppercase mt-2">No Image Selected</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Image URL</label>
                                            <input
                                                type="text"
                                                value={formData.coverImage}
                                                onChange={e => setFormData(prev => ({ ...prev, coverImage: e.target.value }))}
                                                placeholder="Paste URL..."
                                                className="w-full bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-600"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-zinc-100 dark:bg-background-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-100 transition-colors"
                                            >
                                                {isUploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                                                Upload from PC
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Categorization Card */}
                            <div className="bg-white dark:bg-card p-8 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-6">
                                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 border-b border-zinc-50 dark:border-zinc-800 pb-4">Categorization</h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Primary Category</label>
                                            <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="text-[10px] font-black uppercase text-primary hover:underline">+ New</button>
                                        </div>
                                        <select
                                            required
                                            value={formData.categoryId || ""}
                                            onChange={e => setFormData(prev => ({ ...prev, categoryId: (e.target.value || undefined) as Id<"categories"> | undefined }))}
                                            className="w-full bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-3 font-bold text-sm outline-none appearance-none cursor-pointer dark:text-zinc-100"
                                        >
                                            <option value="">Select Category</option>
                                            {categories?.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">SEO Slug</label>
                                        <input
                                            type="text"
                                            value={formData.slug}
                                            onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                            className="w-full bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-3 font-mono text-xs focus:outline-none dark:text-zinc-100"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Discovery Tags</label>
                                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase">{formData.tags.length} added</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={addTag}
                                        onPaste={handleTagPaste}
                                        placeholder="Type & press Enter..."
                                        className="w-full bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-600"
                                    />
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {formData.tags.map(tag => (
                                            <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-background-800/50 text-zinc-600 dark:text-zinc-100 rounded-lg text-[10px] font-black uppercase group">
                                                {tag}
                                                <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500"><X size={10} strokeWidth={3} /></button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* SEO Optimization Card */}
                            <div className="bg-white dark:bg-card p-8 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-6">
                                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 border-b border-zinc-50 dark:border-zinc-800 pb-4">SEO Optimization</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Focus Keyword</label>
                                        <input
                                            type="text"
                                            value={formData.focusKeyword}
                                            onChange={e => {
                                                setFormData(prev => ({ ...prev, focusKeyword: e.target.value }));
                                                setIsFocusKeywordTouched(true);
                                            }}
                                            placeholder="e.g. Psychology of Power"
                                            className="w-full bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-600"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Meta Title</label>
                                            <span className={cn("text-[10px] font-black tabular-nums", formData.metaTitle.length > 60 ? "text-red-500" : "text-zinc-400 dark:text-zinc-500")}>{formData.metaTitle.length} / 60</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.metaTitle}
                                            onChange={e => {
                                                setFormData(prev => ({ ...prev, metaTitle: e.target.value }));
                                                setIsMetaTitleTouched(true);
                                            }}
                                            placeholder="SEO Specific Title..."
                                            className="w-full bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-600"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Meta Description</label>
                                            <span className={cn("text-[10px] font-black tabular-nums", formData.metaDescription.length > 255 ? "text-red-500" : "text-zinc-400 dark:text-zinc-500")}>{formData.metaDescription.length} / 255</span>
                                        </div>
                                        <textarea
                                            value={formData.metaDescription}
                                            onChange={e => {
                                                setFormData(prev => ({ ...prev, metaDescription: e.target.value }));
                                                setIsMetaDescriptionTouched(true);
                                            }}
                                            rows={4}
                                            className="w-full resize-none bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-700 rounded-2xl p-4 focus:outline-none text-zinc-600 dark:text-zinc-200 text-sm leading-relaxed"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Publishing Card */}
                    <div className="bg-white dark:bg-card p-6 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-6 sticky top-24">
                        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 border-b border-zinc-50 dark:border-zinc-800 pb-4">Status & Visibility</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Publish Status</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as "draft" | "published" | "scheduled" }))}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-3 font-bold text-sm outline-none appearance-none cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors dark:text-zinc-100"
                                >
                                    <option value="draft" className="bg-white dark:bg-card text-zinc-900 dark:text-white">Draft (Stay Hidden)</option>
                                    <option value="published" className="bg-white dark:bg-card text-zinc-900 dark:text-white">Publish Now (Publicly Visible)</option>
                                    <option value="scheduled" className="bg-white dark:bg-card text-zinc-900 dark:text-white">Schedule (Future Release)</option>
                                </select>
                            </div>

                            {formData.status === "scheduled" && (
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Schedule For</label>
                                    <div className="relative">
                                        <input
                                            type="datetime-local"
                                            value={scheduledDate}
                                            onChange={(e) => setScheduledDate(e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-2.5 font-bold text-sm outline-none dark:text-zinc-100"
                                        />
                                        <Calendar className="absolute right-4 top-2.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" size={16} />
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/5 rounded-2xl">
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">Featured Article</span>
                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Show in hero section</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, isFeatured: !prev.isFeatured }))}
                                    className={cn(
                                        "w-10 h-5 rounded-full transition-all relative",
                                        formData.isFeatured ? "bg-primary" : "bg-zinc-300 dark:bg-background-700"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                                        formData.isFeatured ? "left-6" : "left-1"
                                    )} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                {isEditing ? "Update Article" : "Publish Article"}
                            </button>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center italic leading-relaxed px-4">
                                Once you publish, an automated email notification will be sent to all your active subscribers.
                            </p>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
}
