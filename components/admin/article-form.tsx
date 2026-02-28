"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Calendar, Image as ImageIcon, Loader2, Save, X, Upload, Users, ChevronDown
} from "lucide-react";
import dynamic from "next/dynamic";
const Editor = dynamic(() => import("./editor"), {
    ssr: false,
    loading: () => <div className="h-[600px] bg-zinc-50 dark:bg-cardanimate-pulse rounded-2xl flex items-center justify-center text-zinc-400 dark:text-zinc-600 font-black uppercase tracking-widest text-xs border border-zinc-100 dark:border-zinc-800">Initializing Premium Editor...</div>
});
import Image from "next/image";
import { useSession } from "next-auth/react";
import { cn, getCloudinaryUrl } from "@/lib/utils";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { uploadImage } from "@/app/actions/upload-image";

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
    const authors = useQuery(api.articles.listAuthors);

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
        authorId: initialData?.authorId as Id<"users"> | undefined,
        coverImageAlt: initialData?.coverImageAlt || "",
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
    const [headingStructure, setHeadingStructure] = useState<{ hasH2: boolean; multipleH1: boolean }>({ hasH2: false, multipleH1: false });
    const [missingAltCount, setMissingAltCount] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Readability and Heading Analysis
    useEffect(() => {
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
                    coverImageAlt: formData.coverImageAlt,
                    authorId: formData.authorId,
                    scheduledFor: scheduledTimestamp,
                    adminEmail: (session?.user?.email as string) || undefined,
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
                    coverImageAlt: formData.coverImageAlt,
                    authorId: formData.authorId,
                    scheduledFor: scheduledTimestamp,
                    adminEmail: (session?.user?.email as string) || undefined,
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
            // Auto-populate alt text from filename
            const fileName = file.name.split('.')[0].replace(/[-_]/g, ' ');
            const capitalizedAlt = fileName.charAt(0).toUpperCase() + fileName.slice(1);

            setFormData(prev => ({
                ...prev,
                coverImage: url,
                coverImageAlt: capitalizedAlt
            }));
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
                <div className="lg:col-span-2 space-y-8">
                    {/* Featured Image - Primary Banner */}
                    <div className="bg-white/40 dark:bg-zinc-950/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 shadow-2xl relative overflow-hidden group/hero">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-1000 group-hover/hero:scale-150" />

                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-500/10 rounded-xl">
                                        <ImageIcon className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Banner Image (Hero)</h4>
                                </div>
                                <span className="text-[9px] font-black uppercase text-blue-500/60 tracking-widest">Recommended size: 1600 x 900 pixels</span>
                            </div>

                            <div className="aspect-[21/9] bg-zinc-100/50 dark:bg-zinc-900/50 rounded-3xl overflow-hidden relative border border-zinc-200 dark:border-zinc-800 group/image group-hover:border-blue-500/30 transition-all duration-500 shadow-inner">
                                {isUploading && (
                                    <div className="absolute inset-0 z-20 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-xl flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                                        <div className="relative">
                                            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                            <Loader2 className="absolute inset-0 m-auto text-blue-500 animate-pulse" size={24} />
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 animate-pulse">Uploading Image...</span>
                                            <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Processing premium quality</span>
                                        </div>
                                    </div>
                                )}
                                {formData.coverImage ? (
                                    <>
                                        <Image
                                            src={getCloudinaryUrl(formData.coverImage, "w_1600,q_auto,f_auto")}
                                            alt="Cover"
                                            fill
                                            className={cn("object-cover transition-transform duration-700 group-hover/image:scale-105", isUploading && "blur-sm grayscale")}
                                            unoptimized
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                                className="p-4 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Upload size={24} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, coverImage: "" }))}
                                                disabled={isUploading}
                                                className="p-4 bg-red-500/20 backdrop-blur-md rounded-full text-white hover:bg-red-500/40 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <X size={24} />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="p-5 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-full mb-4 group-hover/image:scale-110 transition-transform duration-500">
                                            <Upload size={40} strokeWidth={1.5} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Click here to upload a banner image</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
                                <div className="flex-1 relative group/input">
                                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                    <input
                                        type="text"
                                        value={formData.coverImage}
                                        onChange={e => setFormData(prev => ({ ...prev, coverImage: e.target.value }))}
                                        placeholder="Or paste an image link from the web..."
                                        className="w-full bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-xs font-bold focus:outline-none focus:border-blue-500/50 transition-all dark:text-zinc-100 dark:placeholder:text-zinc-600"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Author & Stats Section */}
                    <div className="bg-white/40 dark:bg-zinc-950/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 shadow-sm">
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-purple-500/10 rounded-xl">
                                        <Users className="w-4 h-4 text-purple-500" />
                                    </div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Post Author</h4>
                                </div>
                                <div className="relative">
                                    <select
                                        value={formData.authorId || ""}
                                        onChange={(e) => setFormData({ ...formData, authorId: (e.target.value || undefined) as Id<"users"> | undefined })}
                                        className="w-full pl-6 pr-12 py-4 bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] text-zinc-900 dark:text-white focus:outline-none focus:border-purple-500/30 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Posting as: Current User</option>
                                        {authors?.map(author => (
                                            <option key={author._id} value={author._id}>{author.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" size={18} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-zinc-50/50 dark:bg-zinc-950/30 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                                    <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Today&apos;s Date</span>
                                    <span className="text-[11px] font-black uppercase text-zinc-900 dark:text-zinc-100">
                                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="p-4 bg-zinc-50/50 dark:bg-zinc-950/30 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                                    <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Article ID</span>
                                    <span className="text-[11px] font-mono text-blue-500 uppercase font-black">
                                        {isEditing ? initialData?._id.toString().slice(-8) : 'NEW_POST'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Header */}
                    <div className="flex items-center gap-2 p-1.5 bg-zinc-100/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-2xl w-fit border border-zinc-200 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={() => setActiveTab("general")}
                            className={cn(
                                "px-8 py-3 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300",
                                activeTab === "general"
                                    ? "bg-white dark:bg-zinc-800 text-primary shadow-[0_4px_12px_rgba(0,0,0,0.05)] scale-100"
                                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 scale-95"
                            )}
                        >
                            Main Article
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("advanced")}
                            className={cn(
                                "px-8 py-3 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300",
                                activeTab === "advanced"
                                    ? "bg-white dark:bg-zinc-800 text-primary shadow-[0_4px_12px_rgba(0,0,0,0.05)] scale-100"
                                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 scale-95"
                            )}
                        >
                            Ranking (SEO)
                        </button>
                    </div>

                    <div className="bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl p-10 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 shadow-xl space-y-10 group/substance">
                        {activeTab === 'general' ? (
                            <>
                                {/* Article Title */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-[2px] bg-blue-600 rounded-full" />
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Main Title</label>
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="Enter a catchy title for your post..."
                                        className="w-full bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800 rounded-3xl px-8 py-6 text-3xl font-serif font-black tracking-tight focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all dark:text-zinc-100 dark:placeholder:text-zinc-700 shadow-sm"
                                    />
                                </div>

                                {/* Excerpt */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-[2px] bg-amber-500 rounded-full" />
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Quick Summary (Preview)</label>
                                        </div>
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
                                            if (e.target.value.length <= 225) {
                                                setFormData(prev => ({ ...prev, excerpt: e.target.value }));
                                                setIsExcerptTouched(true);
                                            }
                                        }}
                                        placeholder="Briefly tell readers what this post is about..."
                                        rows={3}
                                        maxLength={225}
                                        className="w-full bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/20 transition-all resize-none dark:text-zinc-100 dark:placeholder:text-zinc-700"
                                    />
                                </div>

                                {/* Editor */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-[2px] bg-purple-600 rounded-full" />
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-600">Your Article Text</label>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider",
                                                charCount >= 800 ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
                                            )}>
                                                <span className="tabular-nums">{charCount}</span> / 800
                                            </div>
                                        </div>
                                    </div>
                                    <Editor
                                        content={formData.content}
                                        onChange={content => setFormData(prev => ({ ...prev, content }))}
                                        onLengthChange={setCharCount}
                                    />
                                    <div className="mt-4 flex flex-wrap gap-4">
                                        <div className={cn("flex items-center gap-2 text-[10px] font-bold uppercase", headingStructure.hasH2 ? "text-green-600" : "text-zinc-400")}>
                                            <div className={cn("w-2 h-2 rounded-full", headingStructure.hasH2 ? "bg-green-500" : "bg-zinc-200")} />
                                            H2 Present
                                        </div>
                                        <div className={cn("flex items-center gap-2 text-[10px] font-bold uppercase", headingStructure.multipleH1 ? "text-red-600" : "text-green-600")}>
                                            <div className={cn("w-2 h-2 rounded-full", headingStructure.multipleH1 ? "bg-red-500" : "bg-green-500")} />
                                            H1 Validation
                                        </div>
                                        <div className={cn("flex items-center gap-2 text-[10px] font-bold uppercase", missingAltCount === 0 ? "text-green-600" : "text-red-600")}>
                                            <div className={cn("w-2 h-2 rounded-full", missingAltCount === 0 ? "bg-green-500" : "bg-red-500")} />
                                            Alt Attributes
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6">
                                {/* Categorization Card */}
                                <div className="bg-white dark:bg-card p-8 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 border-b border-zinc-50 dark:border-zinc-800 pb-4">Topic & Grouping</h3>
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
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Tags</label>
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
                </div>

                <div className="space-y-6">
                    {/* Publishing Card */}
                    <div className="bg-white dark:bg-card p-6 rounded-3xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-6 sticky top-24">
                        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 border-b border-zinc-50 dark:border-zinc-800 pb-4">Publishing Options</h3>

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
