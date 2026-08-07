"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Calendar, Image as ImageIcon, Loader2, X, Upload, Users, ChevronDown, Plus, Search, Save, Layers
} from "lucide-react";
import { fetchCategoryImages } from "@/app/actions/pexels";
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
import { AnimatePresence, motion } from "framer-motion";
import { useTour } from "@/hooks/use-tour";

interface ArticleFormProps {
    isEditing?: boolean;
    initialData?: Doc<"articles"> & { authorName?: string; categoryName?: string };
}

export default function ArticleForm({ isEditing = false, initialData }: ArticleFormProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const categories = useQuery(api.categories.listAll);
    const pillars = useQuery(api.pillars.listAll);
    const allTags = useQuery(api.articles.getAllTags);
    const createArticle = useMutation(api.articles.create);
    const updateArticle = useMutation(api.articles.update);
    const createCategory = useMutation(api.categories.create);
    const createPillar = useMutation(api.pillars.create);
    const authors = useQuery(api.articles.listAuthors);

    // For date picker
    const [scheduledDate, setScheduledDate] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isPillarModalOpen, setIsPillarModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: initialData?.title || "",
        slug: initialData?.slug || "",
        excerpt: initialData?.excerpt || "",
        content: initialData?.content || "",
        coverImage: initialData?.coverImage || "",
        categoryId: (initialData?.categoryId || undefined) as Id<"categories"> | undefined,
        status: initialData?.status || "draft" as "draft" | "published" | "scheduled",
        source: initialData?.source || "human" as "human" | "ai",
        isFeatured: initialData?.isFeatured || false,
        metaTitle: initialData?.metaTitle || "",
        metaDescription: initialData?.metaDescription || "",
        focusKeyword: initialData?.focusKeyword || "",
        authorId: initialData?.authorId as Id<"users"> | undefined,
        coverImageAlt: initialData?.coverImageAlt || "",
        pillar: initialData?.pillar || "",
        topics: initialData?.topics || [] as string[],
        tags: initialData?.tags || [] as string[],
        type: initialData?.type || "cluster" as "pillar" | "cluster" | "micro" | "insight" | "observant",
    });

    const [activeTab, setActiveTab] = useState<"general" | "advanced">("general");
    const [isPexelsModalOpen, setIsPexelsModalOpen] = useState(false);
    const [pexelsSearch, setPexelsSearch] = useState("");
    const [pexelsResults, setPexelsResults] = useState<string[]>([]);
    const [isSearchingPexels, setIsSearchingPexels] = useState(false);
    const [tagInput, setTagInput] = useState("");
    const [isTagSuggestionsOpen, setIsTagSuggestionsOpen] = useState(false);

    // Handle scheduledFor date formatting
    useEffect(() => {
        if (initialData?.scheduledFor) {
            const date = new Date(initialData.scheduledFor);
            // Format to YYYY-MM-DDTHH:MM for datetime-local
            const formatted = date.toISOString().slice(0, 16);
            setScheduledDate(formatted);
        }
    }, [initialData]);

    // Sync initialData -> formData once loaded
    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || "",
                slug: initialData.slug || "",
                excerpt: initialData.excerpt || "",
                content: initialData.content || "",
                coverImage: initialData.coverImage || "",
                categoryId: (initialData.categoryId || undefined) as Id<"categories"> | undefined,
                status: initialData.status || "draft",
                source: initialData.source || "human",
                isFeatured: initialData.isFeatured || false,
                metaTitle: initialData.metaTitle || "",
                metaDescription: initialData.metaDescription || "",
                focusKeyword: initialData.focusKeyword || "",
                authorId: initialData.authorId as Id<"users"> | undefined,
                coverImageAlt: initialData.coverImageAlt || "",
                pillar: initialData.pillar || "",
                topics: initialData.topics || [],
                tags: initialData.tags || [],
                type: initialData.type || "cluster",
            });
        }
    }, [initialData]);


    const [isUploading, setIsUploading] = useState(false);
    const [charCount, setCharCount] = useState(0);
    const [headingStructure, setHeadingStructure] = useState<{ hasH2: boolean; multipleH1: boolean }>({ hasH2: false, multipleH1: false });
    
    // Initialize Tour
    const { startTour } = useTour("admin-blog-creation", true);
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

    // Consolidated sync effect for Title-dependent fields (Slug, Meta Title)
    useEffect(() => {
        setFormData(prev => {
            if (!prev.title) return prev;

            const newSlug = prev.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            
            const newMetaTitle = prev.title.length > 60 ? prev.title.substring(0, 57) + "..." : prev.title;

            let updated = prev;

            // Sync Slug
            if (!isEditing && newSlug !== prev.slug) {
                updated = { ...updated, slug: newSlug };
            }

            // Sync Meta Title
            if (!isMetaTitleTouched && newMetaTitle !== prev.metaTitle) {
                updated = { ...updated, metaTitle: newMetaTitle };
            }

            return updated;
        });
    }, [formData.title, isEditing, isMetaTitleTouched, formData.slug, formData.metaTitle]);

    // Sync Excerpt and Meta Description (consolidated to prevent loops)
    useEffect(() => {
        setFormData(prev => {
            const hasEx = !!prev.excerpt;
            const hasMD = !!prev.metaDescription;
            const trimmedMeta = prev.metaDescription?.substring(0, 225);

            // Sync Excerpt -> Meta Description
            if (!isMetaDescriptionTouched && hasEx && prev.excerpt !== prev.metaDescription) {
                return { ...prev, metaDescription: prev.excerpt };
            }

            // Sync Meta Description -> Excerpt
            if (!isExcerptTouched && hasMD && trimmedMeta !== prev.excerpt) {
                return { ...prev, excerpt: trimmedMeta };
            }

            return prev; // No change needed
        });
    }, [formData.excerpt, formData.metaDescription, isMetaDescriptionTouched, isExcerptTouched]);

    // Sync Topics -> Focus Keyword
    useEffect(() => {
        setFormData(prev => {
            if (!isFocusKeywordTouched && prev.topics.length > 0 && prev.topics[0] !== prev.focusKeyword) {
                return { ...prev, focusKeyword: prev.topics[0] };
            }
            return prev;
        });
    }, [formData.topics, isFocusKeywordTouched, formData.focusKeyword]);

    // Pexels for Category Modal
    const [catPexelsSearch, setCatPexelsSearch] = useState("");
    const [catPexelsResults, setCatPexelsResults] = useState<string[]>([]);
    const [selectedCatImages, setSelectedCatImages] = useState<string[]>([]);
    const [isSearchingCatPexels, setIsSearchingCatPexels] = useState(false);

    const handleSearchCatPexels = async () => {
        if (!catPexelsSearch.trim()) return;
        setIsSearchingCatPexels(true);
        try {
            const images = await fetchCategoryImages(catPexelsSearch, 20);
            setCatPexelsResults(images);
        } catch {
            toast.error("Failed to fetch Pexels images for category");
        } finally {
            setIsSearchingCatPexels(false);
        }
    };

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
            if (formData.tags.length < 4) {
                toast.error("Minimum 4 tags required for publishing");
                return;
            }
            if (formData.topics.length !== 1) {
                toast.error("Exactly one topic is required for publishing");
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
                    status: formData.status,
                    source: formData.source,
                    isFeatured: formData.isFeatured,
                    metaTitle: formData.metaTitle,
                    metaDescription: formData.metaDescription,
                    focusKeyword: formData.focusKeyword,
                    coverImageAlt: formData.coverImageAlt,
                    authorId: formData.authorId,
                    pillar: formData.pillar,
                    topics: formData.topics,
                    tags: formData.tags,
                    type: formData.type,
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
                    status: formData.status,
                    source: formData.source,
                    isFeatured: formData.isFeatured,
                    metaTitle: formData.metaTitle,
                    metaDescription: formData.metaDescription,
                    focusKeyword: formData.focusKeyword,
                    coverImageAlt: formData.coverImageAlt,
                    authorId: formData.authorId,
                    pillar: formData.pillar,
                    topics: formData.topics,
                    tags: formData.tags,
                    type: formData.type,
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
        } catch (error) {
            console.error(error);
            toast.error("Upload failed");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSearchPexels = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!pexelsSearch.trim()) return;

        setIsSearchingPexels(true);
        try {
            const images = await fetchCategoryImages(pexelsSearch, 20);
            setPexelsResults(images);
        } catch {
            toast.error("Failed to fetch Pexels images");
        } finally {
            setIsSearchingPexels(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Featured Image - Primary Banner */}
                    <div id="tour-article-banner" className="bg-white/40 dark:bg-zinc-950/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 shadow-2xl relative overflow-hidden group/hero">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-1000 group-hover/hero:scale-150" />

                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-500/10 rounded-xl">
                                        <ImageIcon className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Banner Image (Hero)</h4>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[9px] font-black uppercase text-blue-500/60 tracking-widest hidden sm:inline-block">1600 x 900 recommended</span>
                                    <button
                                        type="button"
                                        onClick={startTour}
                                        className="text-[10px] font-black uppercase tracking-widest text-blue-600 border border-blue-600/30 bg-blue-600/10 px-4 py-2 rounded-xl hover:bg-blue-600/20 transition-colors"
                                    >
                                        Restart Tour
                                    </button>
                                </div>
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
                                <button
                                    type="button"
                                    onClick={() => setIsPexelsModalOpen(true)}
                                    className="flex items-center gap-2 px-6 py-4 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-zinc-950/20 dark:shadow-white/10"
                                >
                                    <Search size={14} />
                                    Search Pexels
                                </button>
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
                            <div id="tour-article-author" className="space-y-4">
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
                            id="tour-article-seo"
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
                                <div id="tour-article-title" className="space-y-4">
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
                                <div id="tour-article-editor" className="space-y-4">
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

                                    {/* New Metadata Fields */}
                                    <div className="pt-6 border-t border-zinc-50 dark:border-zinc-800 space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Content Pillar</label>
                                                    <button type="button" onClick={() => setIsPillarModalOpen(true)} className="text-[10px] font-black uppercase text-primary hover:underline">+ New</button>
                                                </div>
                                                <select
                                                    value={formData.pillar}
                                                    onChange={e => setFormData(prev => ({ ...prev, pillar: e.target.value }))}
                                                    className="w-full bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-3 font-bold text-sm outline-none appearance-none cursor-pointer dark:text-zinc-100 disabled:opacity-50"
                                                    disabled={!pillars}
                                                >
                                                    <option value="">{pillars === undefined ? "Loading pillars..." : "Select Pillar (Optional)"}</option>
                                                    {pillars?.filter(p => !formData.categoryId || p.categoryId === formData.categoryId).map(p => (
                                                        <option key={p._id} value={p.slug}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Content Type</label>
                                                <select
                                                    value={formData.type}
                                                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as "pillar" | "cluster" | "micro" | "insight" | "observant" }))}
                                                    className="w-full bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-3 font-bold text-sm outline-none appearance-none cursor-pointer dark:text-zinc-100"
                                                >
                                                    <option value="cluster">Cluster (Standard Post)</option>
                                                    <option value="pillar">Pillar (Core Guide)</option>
                                                    <option value="micro">Micro Post (Short)</option>
                                                    <option value="insight">Insight Page (Data-driven)</option>
                                                    <option value="observant">Observant (Philosophical)</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Primary Topic</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.topics[0] || ""}
                                                    onChange={e => setFormData(prev => ({ ...prev, topics: e.target.value ? [e.target.value] : [] }))}
                                                    placeholder="Enter main topic (e.g. Cognitive Biases)"
                                                    className="w-full bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-3 font-bold text-sm outline-none dark:text-zinc-100 dark:placeholder:text-zinc-600"
                                                />
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Article Tags</label>
                                                    <span className={cn("text-[10px] font-bold uppercase", formData.tags.length < 4 ? "text-amber-500" : "text-green-600")}>
                                                        {formData.tags.length} / 4 Required
                                                    </span>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={tagInput}
                                                        onChange={e => {
                                                            setTagInput(e.target.value);
                                                            setIsTagSuggestionsOpen(true);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ',') {
                                                                e.preventDefault();
                                                                const val = tagInput.trim().replace(/,$/, '');
                                                                if (val && !formData.tags.includes(val)) {
                                                                    setFormData(prev => ({ ...prev, tags: [...prev.tags, val] }));
                                                                    setTagInput("");
                                                                }
                                                            }
                                                        }}
                                                        onPaste={(e) => {
                                                            e.preventDefault();
                                                            const paste = e.clipboardData.getData('text');
                                                            const tags = paste.split(/[,\n]/).map(t => t.trim()).filter(t => t && !formData.tags.includes(t));
                                                            if (tags.length > 0) {
                                                                setFormData(prev => ({ ...prev, tags: [...prev.tags, ...tags] }));
                                                            }
                                                        }}
                                                        onBlur={() => setTimeout(() => setIsTagSuggestionsOpen(false), 200)}
                                                        placeholder="Add tags (Enter or comma)..."
                                                        className="w-full bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-600"
                                                    />
                                                    {isTagSuggestionsOpen && tagInput && (
                                                        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-xl shadow-xl overflow-hidden py-1">
                                                            {allTags?.filter(t => t.toLowerCase().includes(tagInput.toLowerCase()) && !formData.tags.includes(t))
                                                                .slice(0, 5)
                                                                .map(tag => (
                                                                    <button
                                                                        key={tag}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                                                                            setTagInput("");
                                                                            setIsTagSuggestionsOpen(false);
                                                                        }}
                                                                        className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 font-medium"
                                                                    >
                                                                        {tag}
                                                                    </button>
                                                                ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {formData.tags.map(tag => (
                                                        <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 rounded-lg text-[10px] font-black uppercase group transition-all hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500">
                                                            {tag}
                                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))} className="opacity-50 group-hover:opacity-100"><X size={10} strokeWidth={3} /></button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
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
                                            ></textarea>
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
                                id="tour-article-save"
                                type="submit"
                                disabled={isSubmitting}
                                className="cursor-pointer w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
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

            {/* Category Creation Modal */}
            <AnimatePresence>
                {isCategoryModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-zinc-200 dark:border-white/5"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                                            <Plus className="text-primary" size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black uppercase tracking-tight dark:text-zinc-100">Quick Category</h3>
                                            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Add new architectural classification</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsCategoryModalOpen(false)} className="w-8 h-8 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center justify-center text-zinc-400 transition-colors">
                                        <X size={18} />
                                    </button>
                                </div>

                                <form onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                                    e.preventDefault();
                                    const formDataObj = new FormData(e.currentTarget);
                                    const name = formDataObj.get("categoryName") as string;
                                    const description = formDataObj.get("categoryDesc") as string;
                                    if (!name) return;
                                    
                                    try {
                                        const id = await createCategory({ 
                                            name, 
                                            slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                                            description,
                                            pexelsImages: selectedCatImages
                                        });
                                        setFormData(prev => ({ ...prev, categoryId: id as Id<"categories"> }));
                                        setIsCategoryModalOpen(false);
                                        toast.success("Category created and selected");
                                    } catch (error) {
                                        console.error(error);
                                        toast.error("Failed to create category");
                                    }
                                }} className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2 ml-1">Category Name</label>
                                        <input name="categoryName" type="text" required placeholder="e.g. Psychology" className="w-full bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/5 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-600" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2 ml-1">Short Description</label>
                                        <textarea name="categoryDesc" rows={3} placeholder="Briefly describe this category..." className="w-full bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/5 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-600 resize-none" />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">Category Visuals (Pexels)</label>
                                            <span className={cn("text-[10px] font-black uppercase", selectedCatImages.length >= 2 && selectedCatImages.length <= 10 ? "text-green-500" : "text-amber-500")}>
                                                {selectedCatImages.length} / 10 Selected (Min 2)
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={catPexelsSearch}
                                                onChange={(e) => setCatPexelsSearch(e.target.value)}
                                                placeholder="Search category images..." 
                                                className="flex-1 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-3 text-xs font-bold outline-none dark:text-zinc-100" 
                                            />
                                            <button 
                                                type="button"
                                                onClick={handleSearchCatPexels}
                                                disabled={isSearchingCatPexels}
                                                className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
                                            >
                                                {isSearchingCatPexels ? "..." : "Fetch"}
                                            </button>
                                        </div>

                                        {catPexelsResults.length > 0 && (
                                            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-zinc-50 dark:bg-zinc-950/20 rounded-2xl border border-zinc-200 dark:border-white/5">
                                                {catPexelsResults.map((url, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => {
                                                            if (selectedCatImages.includes(url)) {
                                                                setSelectedCatImages(prev => prev.filter(img => img !== url));
                                                            } else if (selectedCatImages.length < 10) {
                                                                setSelectedCatImages(prev => [...prev, url]);
                                                            } else {
                                                                toast.error("Maximum 10 images allowed");
                                                            }
                                                        }}
                                                        className={cn(
                                                            "aspect-square rounded-lg overflow-hidden border-2 transition-all relative",
                                                            selectedCatImages.includes(url) ? "border-blue-500 scale-95 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                                                        )}
                                                    >
                                                        <Image src={url} alt={`Cat ${i}`} fill className="object-cover" unoptimized />
                                                        {selectedCatImages.includes(url) && (
                                                            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                                                <div className="bg-white rounded-full p-0.5">
                                                                    <Plus className="text-blue-500 rotate-45" size={12} />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                        disabled={selectedCatImages.length < 2}
                                    >
                                        {selectedCatImages.length < 2 ? "Select At Least 2 Images" : "Create & Select"}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Pillar Creation Modal */}
            <AnimatePresence>
                {isPillarModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-zinc-200 dark:border-white/5"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                                            <Layers className="text-primary" size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black uppercase tracking-tight dark:text-zinc-100">Deep Insights Pillar</h3>
                                            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Create a core content grouping</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsPillarModalOpen(false)} className="w-8 h-8 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center justify-center text-zinc-400 transition-colors">
                                        <X size={18} />
                                    </button>
                                </div>

                                <form onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                                    e.preventDefault();
                                    const formDataObj = new FormData(e.currentTarget);
                                    const name = formDataObj.get("pillarName") as string;
                                    const description = formDataObj.get("pillarDesc") as string;
                                    if (!name || !formData.categoryId) {
                                        toast.error("Pillar name and category are required");
                                        return;
                                    }
                                    
                                    try {
                                        const slug = name.toLowerCase()
                                            .replace(/[^a-z0-9]+/g, '-')
                                            .replace(/(^-|-$)/g, '');
                                        await createPillar({ 
                                            name, 
                                            slug,
                                            categoryId: formData.categoryId as Id<"categories">,
                                            description 
                                        });
                                        setIsPillarModalOpen(false);
                                        toast.success("Pillar created successfully");
                                    } catch (err: unknown) {
                                        toast.error(err instanceof Error ? err.message : "Failed to create pillar");
                                    }
                                }} className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2 ml-1">Pillar Name</label>
                                        <input name="pillarName" type="text" required placeholder="e.g. Archetypes of Power" className="w-full bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/5 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-600" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2 ml-1">Description (Optional)</label>
                                        <textarea name="pillarDesc" rows={3} placeholder="What this pillar represents..." className="w-full bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-white/5 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-600 resize-none" />
                                    </div>
                                    <div className="p-4 bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-100 dark:border-amber-500/10">
                                        <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold uppercase leading-relaxed">
                                            This pillar will be linked to the currently selected category: <span className="text-zinc-900 dark:text-zinc-100">{categories?.find(c => c._id === formData.categoryId)?.name || "None"}</span>
                                        </p>
                                    </div>
                                    <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:opacity-90 transition-all shadow-lg shadow-primary/20">Construct Pillar</button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Pexels Search Modal */}
            <AnimatePresence>
                {isPexelsModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 40 }}
                            className="bg-white dark:bg-zinc-900 w-full max-w-5xl h-[80vh] rounded-[3rem] overflow-hidden shadow-2xl border border-zinc-200 dark:border-white/5 flex flex-col"
                        >
                            <div className="p-10 border-b border-zinc-100 dark:border-white/5 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
                                <div className="flex items-center justify-between gap-8">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-[1.5rem] bg-zinc-950 dark:bg-white flex items-center justify-center">
                                            <Search className="text-white dark:text-zinc-950" size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-serif font-black text-zinc-950 dark:text-white tracking-tight italic">Pexels Engine</h3>
                                            <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Source high-velocity premium visual assets</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsPexelsModalOpen(false)}
                                        className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-white/5 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <form onSubmit={handleSearchPexels} className="mt-8 flex gap-4">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                        <input
                                            type="text"
                                            value={pexelsSearch}
                                            onChange={(e) => setPexelsSearch(e.target.value)}
                                            placeholder="What atmosphere are we manifesting today?"
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-white/5 rounded-2xl pl-16 pr-8 py-5 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-zinc-400"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSearchingPexels}
                                        className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all disabled:opacity-50 shadow-xl shadow-blue-500/20"
                                    >
                                        {isSearchingPexels ? "Searching..." : "Execute Search"}
                                    </button>
                                </form>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-zinc-50/30 dark:bg-zinc-950/20">
                                {pexelsResults.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {pexelsResults.map((url, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, coverImage: url });
                                                    setIsPexelsModalOpen(false);
                                                }}
                                                className="group relative aspect-video rounded-[2rem] overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all duration-500 shadow-lg"
                                            >
                                                <Image
                                                    src={url}
                                                    alt={`Pexels result ${i}`}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                    unoptimized
                                                />
                                                <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="bg-white text-zinc-950 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl scale-90 group-hover:scale-100 transition-transform">Select Asset</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                                        <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center mb-6">
                                            <ImageIcon size={40} className="opacity-20" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center max-w-[200px] leading-relaxed opacity-50">Enter a query to access the visual archive</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 border-t border-zinc-100 dark:border-white/5 bg-white/50 dark:bg-zinc-900/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">API Connection Active</span>
                                </div>
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Images sourced via Pexels Library</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
