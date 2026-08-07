"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    X, 
    Image as ImageIcon, 
    Loader2, 
    ChevronRight, 
    Check,
    Layers,
    LayoutDashboard,
    Folder,
    FileText,
    Settings,
} from "lucide-react";
import { toast } from "sonner";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { fetchCategoryImages } from "@/app/actions/pexels";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useTour } from "@/hooks/use-tour";

type CategoryWithCount = Doc<"categories"> & {
    articleCount: number;
    pillarCount: number;
};

export default function CategoriesPage() {
    const categories = useQuery(api.categories.listAll);
    const pillars = useQuery(api.pillars.listAll);
    
    const removeCategory = useMutation(api.categories.remove);
    const createCategory = useMutation(api.categories.create);
    const updateCategory = useMutation(api.categories.update);

    const createPillar = useMutation(api.pillars.create);
    const updatePillar = useMutation(api.pillars.update);
    const removePillar = useMutation(api.pillars.remove);

    const [activeTab, setActiveTab] = useState<"categories" | "pillars">("categories");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPillarModalOpen, setIsPillarModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchFilter, setSearchFilter] = useState<"name" | "category">("name");

    // Form states
    const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        coverImage: "",
        pexelsImages: [] as string[]
    });

    const [editingPillar, setEditingPillar] = useState<Doc<"pillars"> | null>(null);
    const [pillarFormData, setPillarFormData] = useState({
        name: "",
        slug: "",
        description: "",
        coverImage: "",
        pexelsImages: [] as string[],
        categoryId: "" as Id<"categories">
    });

    // Pexels State
    const [isPexelsModalOpen, setIsPexelsModalOpen] = useState(false);
    const [pexelsQuery, setPexelsQuery] = useState("");
    const [pexelsImages, setPexelsImages] = useState<string[]>([]);
    const [isSearchingPexels, setIsSearchingPexels] = useState(false);
    const [pexelsPage, setPexelsPage] = useState(1);
    const [selectedInModal, setSelectedInModal] = useState<string[]>([]);
    const [activeImageTarget, setActiveImageTarget] = useState<"category" | "pillar" | null>(null);

    // Initialize Tour
    const { startTour } = useTour("admin-categories", true);

    // Prevent body scroll when any modal is open
    useEffect(() => {
        if (isPexelsModalOpen || isModalOpen || isPillarModalOpen) {
            document.body.style.overflow = "hidden";
            document.body.style.overscrollBehavior = "none";
        } else {
            document.body.style.overflow = "unset";
            document.body.style.overscrollBehavior = "unset";
        }
        return () => { 
            document.body.style.overflow = "unset"; 
            document.body.style.overscrollBehavior = "unset";
        };
    }, [isPexelsModalOpen, isModalOpen, isPillarModalOpen]);

    const resetForm = () => {
        setFormData({ name: "", slug: "", description: "", coverImage: "", pexelsImages: [] });
        setEditingCategory(null);
    };

    const resetPillarForm = () => {
        setPillarFormData({ 
            name: "", 
            slug: "", 
            description: "", 
            coverImage: "",
            pexelsImages: [],
            categoryId: "" as Id<"categories"> 
        });
        setEditingPillar(null);
    };

    const handleEdit = (cat: CategoryWithCount) => {
        setEditingCategory(cat);
        setFormData({
            name: cat.name,
            slug: cat.slug,
            description: cat.description || "",
            coverImage: cat.coverImage || "",
            pexelsImages: cat.pexelsImages || []
        });
        setIsModalOpen(true);
    };

    const handlePillarEdit = (pillar: Doc<"pillars">) => {
        setEditingPillar(pillar);
        setPillarFormData({
            name: pillar.name,
            slug: pillar.slug,
            description: pillar.description || "",
            coverImage: pillar.coverImage || "",
            pexelsImages: pillar.pexelsImages || [],
            categoryId: pillar.categoryId
        });
        setIsPillarModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingCategory) {
                await updateCategory({ id: editingCategory._id, ...formData });
                toast.success("Category updated successfully");
            } else {
                await createCategory(formData);
                toast.success("New category established");
            }
            setIsModalOpen(false);
            resetForm();
        } catch {
            toast.error("Process failed. Please verify inputs.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePillarSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pillarFormData.categoryId) {
            toast.error("A parent category is required.");
            return;
        }
        setIsSubmitting(true);
        try {
            if (editingPillar) {
                await updatePillar({ id: editingPillar._id, ...pillarFormData });
                toast.success("Pillar structure updated");
            } else {
                await createPillar(pillarFormData);
                toast.success("New pillar constructed");
            }
            setIsPillarModalOpen(false);
            resetPillarForm();
        } catch (err) {
            console.error("Pillar error:", err);
            toast.error(err instanceof Error ? err.message : "Construction failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: Id<"categories">) => {
        toast("Permanently dismantle this category?", {
            description: "Articles will remain but will lose their classification.",
            action: {
                label: "Confirm",
                onClick: async () => {
                    try {
                        await removeCategory({ id });
                        toast.success("Category dismantled");
                    } catch {
                        toast.error("Action denied: Articles or pillars may be tied to this category.");
                    }
                }
            }
        });
    };

    const handlePillarDelete = async (id: Id<"pillars">) => {
        toast("Dismantle this pillar?", {
            description: "This will remove the specific classification from linked articles.",
            action: {
                label: "Confirm",
                onClick: async () => {
                    try {
                        await removePillar({ id });
                        toast.success("Pillar removed");
                    } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Action failed");
                    }
                }
            }
        });
    };

    const searchPexels = async (page: number = 1, queryOverride?: string) => {
        const queryToSearch = queryOverride || pexelsQuery;
        if (!queryToSearch) return;
        setIsSearchingPexels(true);
        setPexelsPage(page);
        try {
            const images = await fetchCategoryImages(queryToSearch, 24, page);
            setPexelsImages(images);
        } catch {
            toast.error("Visual library inaccessible");
        } finally {
            setIsSearchingPexels(false);
        }
    };

    const toggleModalImage = (url: string) => {
        setSelectedInModal(prev => 
            prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
        );
    };

    const confirmPexelsSelection = () => {
        const setSelection = <T extends { pexelsImages?: string[]; coverImage?: string }>(prev: T): T => {
            const existing = prev.pexelsImages || [];
            const combined = Array.from(new Set([...existing, ...selectedInModal]));
            return {
                ...prev,
                pexelsImages: combined,
                coverImage: prev.coverImage || selectedInModal[0] || ""
            };
        };

        if (activeImageTarget === "category") setFormData(setSelection);
        else if (activeImageTarget === "pillar") setPillarFormData(setSelection);
        
        setIsPexelsModalOpen(false);
        setSelectedInModal([]);
    };

    const filteredCategories = (categories || []).filter(cat => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        
        if (searchFilter === "category") {
            return cat.name.toLowerCase().includes(query) || cat.slug.toLowerCase().includes(query);
        }

        const matchingPillar = pillars?.some(p => p.categoryId === cat._id && p.name.toLowerCase().includes(query));
        return (
            cat.name.toLowerCase().includes(query) ||
            cat.slug.toLowerCase().includes(query) ||
            (cat.description || "").toLowerCase().includes(query) ||
            matchingPillar
        );
    });

    const filteredPillars = (pillars || []).filter(p => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        
        const category = categories?.find(c => c._id === p.categoryId);
        const categoryName = category?.name.toLowerCase() || "";

        if (searchFilter === "category") {
            return categoryName.includes(query);
        }

        return (
            p.name.toLowerCase().includes(query) ||
            p.slug.toLowerCase().includes(query) ||
            (p.description || "").toLowerCase().includes(query) ||
            categoryName.includes(query)
        );
    });

    if (!categories || !pillars) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4 text-blue-600">
                    <Loader2 className="animate-spin" size={40} strokeWidth={1.5} />
                    <p className="text-sm font-black uppercase tracking-widest text-gray-400">Synchronizing Taxonomy...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 pb-20 px-4 sm:px-6 lg:px-8">
            {/* NEW: Sticky Header for quick access */}
            <div id="tour-categories-top" className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 py-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 transition-all">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <LayoutDashboard size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight dark:text-white">Taxonomy Manager</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Hierarchy System</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                        <button
                            id="tour-categories-restart"
                            onClick={startTour}
                            className="mr-2 text-[10px] font-black uppercase tracking-widest text-blue-600 border border-blue-600/30 bg-blue-600/10 px-4 py-2 rounded-xl hover:bg-blue-600/20 transition-colors"
                        >
                            Restart Tour
                        </button>
                        <div id="tour-categories-search" className="relative flex items-center bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl transition-all focus-within:ring-2 focus-within:ring-blue-600/20 focus-within:border-blue-600 w-full sm:w-auto">
                            <select 
                                value={searchFilter}
                                onChange={e => setSearchFilter(e.target.value as "name" | "category")}
                                className="pl-4 pr-8 py-2 bg-transparent text-xs font-bold border-r border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 focus:outline-none appearance-none cursor-pointer"
                            >
                                <option value="name" className="dark:bg-zinc-900">Name</option>
                                <option value="category" className="dark:bg-zinc-900">Category</option>
                            </select>
                            <div className="relative flex-1 sm:w-48">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={searchFilter === "name" ? "Search by name..." : "Search by category..."}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-transparent text-sm focus:outline-none dark:text-white"
                                />
                            </div>
                        </div>
                        <div id="tour-categories-creation" className="flex items-center gap-2">
                            <button
                                onClick={() => { resetForm(); setIsModalOpen(true); }}
                                className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                                title="New Category"
                            >
                                <Plus size={20} />
                            </button>
                            <button
                                onClick={() => { resetPillarForm(); setIsPillarModalOpen(true); }}
                                className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20"
                                title="New Pillar"
                            >
                                <Layers size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-white/5 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Total Categories</p>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-black dark:text-white leading-none">{categories.length}</span>
                        <Folder className="text-blue-500 opacity-20" size={32} />
                    </div>
                </div>
                <div className="bg-white dark:bg-white/5 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Active Pillars</p>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-black dark:text-white leading-none">{pillars.length}</span>
                        <Layers className="text-purple-500 opacity-20" size={32} />
                    </div>
                </div>
                <div className="bg-white dark:bg-white/5 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Total Artifacts</p>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-black dark:text-white leading-none">
                            {categories.reduce((acc, cat) => acc + (cat.articleCount || 0), 0)}
                        </span>
                        <FileText className="text-emerald-500 opacity-20" size={32} />
                    </div>
                </div>
                <div className="bg-white dark:bg-white/5 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">System Health</p>
                    <div className="flex items-end justify-between">
                        <span className="text-lg font-black text-emerald-500 uppercase italic">Operational</span>
                        <Settings className="text-gray-400 opacity-20 animate-spin-slow" size={32} />
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div id="tour-categories-tabs" className="flex items-center gap-1 bg-gray-50 dark:bg-white/5 p-1 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab("categories")}
                    className={cn(
                        "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        activeTab === "categories" 
                            ? "bg-white dark:bg-white/10 text-blue-600 shadow-sm" 
                            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    )}
                >
                    Core Categories
                </button>
                <button
                    onClick={() => setActiveTab("pillars")}
                    className={cn(
                        "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        activeTab === "pillars" 
                            ? "bg-white dark:bg-white/10 text-purple-600 shadow-sm" 
                            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    )}
                >
                    Knowledge Pillars
                </button>
            </div>

            {/* Main Content Area */}
            <AnimatePresence mode="wait">
                {activeTab === "categories" ? (
                    <motion.div
                        key="categories"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {filteredCategories.map((cat: CategoryWithCount) => (
                            <div
                                key={cat._id}
                                className="group relative aspect-[4/3] rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-zinc-900 shadow-sm transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10"
                            >
                                {/* Background Image */}
                                {cat.coverImage ? (
                                    <Image
                                        src={cat.coverImage}
                                        alt={cat.name}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <Image
                                        src={`https://placehold.co/600x400/2563eb/ffffff?text=${encodeURIComponent(cat.name)}`}
                                        alt={cat.name}
                                        fill
                                        className="object-cover opacity-60 group-hover:opacity-80 transition-all duration-700"
                                    />
                                )}
                                
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                                {/* Content */}
                                <div className="absolute inset-0 p-8 flex flex-col justify-between">
                                    <div className="flex justify-between items-start translate-y-[-10px] group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                                        <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[9px] font-black text-white uppercase tracking-widest">
                                            {cat.slug}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(cat)} className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-blue-600 transition-colors">
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(cat._id)} className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-red-500 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-3xl font-black text-white leading-tight">{cat.name}</h3>
                                        <p className="text-xs text-gray-300 font-medium line-clamp-2 max-w-[85%] italic">
                                            {cat.description || "No description provided."}
                                        </p>
                                        <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                                    {cat.articleCount || 0} Articles
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                                                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                                    {cat.pillarCount || 0} Pillars
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="pillars"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        {filteredPillars.map((p) => (
                            <div
                                key={p._id}
                                className="group bg-white dark:bg-white/5 rounded-3xl p-6 border border-gray-100 dark:border-white/5 hover:border-purple-600/30 transition-all hover:shadow-xl hover:shadow-purple-500/5"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-purple-600 transition-colors">
                                        <Layers size={22} />
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => handlePillarEdit(p)} className="p-2 text-gray-400 hover:text-purple-600 transition-colors"><Edit2 size={16} /></button>
                                        <button onClick={() => handlePillarDelete(p._id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                <h4 className="text-xl font-black dark:text-white mb-1">{p.name}</h4>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-[9px] font-black uppercase text-gray-400">Section:</span>
                                    <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">
                                        {categories?.find(c => c._id === p.categoryId)?.name || "External"}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 italic leading-relaxed line-clamp-3">
                                    {p.description || "No description provided."}
                                </p>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Standard Category Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setIsModalOpen(false); resetForm(); }}
                            className="absolute inset-0 bg-gray-950/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="bg-white dark:bg-zinc-950 w-full max-w-xl rounded-[2.5rem] shadow-huge relative z-10 border border-white/10 flex flex-col max-h-[90vh] overflow-hidden"
                        >
                            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar pointer-events-auto" data-lenis-prevent="true">
                                <div className="flex justify-between items-center mb-10">
                                    <div>
                                        <h2 className="text-3xl font-black dark:text-white">Category Setup</h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Core Node Definition</p>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all">
                                        <X size={24} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Display Name</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
                                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-4 font-bold text-sm focus:ring-2 focus:ring-blue-600 dark:text-white transition-all"
                                                placeholder="e.g. Health"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">URL Slug</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.slug}
                                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-4 font-mono text-xs font-bold text-blue-600 dark:text-blue-400 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-4 h-32 text-sm font-medium resize-none dark:text-white transition-all"
                                            placeholder="Describe the scope of this category..."
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cover Visual</label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setActiveImageTarget("category");
                                                    const q = formData.name || "";
                                                    setPexelsQuery(q);
                                                    setIsPexelsModalOpen(true);
                                                    searchPexels(1, q);
                                                }}
                                                className="flex items-center gap-2 text-teal-600 hover:text-teal-500 text-[10px] font-black uppercase tracking-widest"
                                            >
                                                <Search size={14} />
                                                Fetch from Pexels
                                            </button>
                                        </div>
                                        {formData.coverImage && (
                                            <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10">
                                                <Image src={formData.coverImage} alt="Cover" fill className="object-cover" />
                                                <button 
                                                    type="button"
                                                    onClick={() => setFormData({...formData, coverImage: ""})}
                                                    className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black transition-colors"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        )}

                                        {/* Visual Library */}
                                        {formData.pexelsImages && formData.pexelsImages.length > 0 && (
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Asset Gallery (Preselected Images)</label>
                                                <div className="grid grid-cols-4 gap-3">
                                                    {formData.pexelsImages.map((img, idx) => (
                                                        <div 
                                                            key={idx}
                                                            onClick={() => setFormData({ ...formData, coverImage: img })}
                                                            className={cn(
                                                                "group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all",
                                                                formData.coverImage === img ? "border-blue-600 ring-4 ring-blue-600/10 scale-95" : "border-transparent opacity-70 hover:opacity-100 hover:scale-105"
                                                            )}
                                                        >
                                                            <Image src={img} alt="Library" fill className="object-cover" />
                                                            {formData.coverImage === img && (
                                                                <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center">
                                                                    <div className="bg-blue-600 rounded-full p-1 shadow-lg">
                                                                        <Check className="text-white" size={12} strokeWidth={4} />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const updated = formData.pexelsImages?.filter((_, i) => i !== idx);
                                                                    setFormData({ 
                                                                        ...formData, 
                                                                        pexelsImages: updated,
                                                                        coverImage: formData.coverImage === img ? (updated?.[0] || "") : formData.coverImage
                                                                    });
                                                                }}
                                                                className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110 z-10"
                                                                title="Remove Asset"
                                                            >
                                                                <X size={10} strokeWidth={3} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {isSubmitting && <Loader2 className="animate-spin" size={20} />}
                                        {editingCategory ? "Update Classification" : "Establish Category"}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Pillar Modal */}
            <AnimatePresence>
                {isPillarModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setIsPillarModalOpen(false); resetPillarForm(); }}
                            className="absolute inset-0 bg-gray-950/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="bg-white dark:bg-zinc-950 w-full max-w-xl rounded-[2.5rem] shadow-huge relative z-10 border border-white/10 flex flex-col max-h-[90vh] overflow-hidden"
                        >
                            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar pointer-events-auto" data-lenis-prevent="true">
                                <div className="flex justify-between items-center mb-10">
                                    <div>
                                        <h2 className="text-3xl font-black dark:text-white">Pillar Construction</h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-purple-600">Deep-Dive Specification</p>
                                    </div>
                                    <button onClick={() => setIsPillarModalOpen(false)} className="p-2 rounded-full hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all">
                                        <X size={24} />
                                    </button>
                                </div>

                                <form onSubmit={handlePillarSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-left block">Parent Architecture</label>
                                        <select
                                            required
                                            value={pillarFormData.categoryId}
                                            onChange={e => setPillarFormData(prev => ({ ...prev, categoryId: e.target.value as Id<"categories"> }))}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-4 font-bold text-sm dark:text-white appearance-none transition-all"
                                        >
                                            <option value="">Select Category</option>
                                            {categories?.map(cat => (
                                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-left block">Pillar Name</label>
                                            <input
                                                required
                                                type="text"
                                                value={pillarFormData.name}
                                                onChange={e => setPillarFormData(prev => ({ 
                                                    ...prev, 
                                                    name: e.target.value, 
                                                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') 
                                                }))}
                                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-4 font-bold text-sm dark:text-white transition-all"
                                                placeholder="e.g. Longevity"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-left block">Anchor Slug</label>
                                            <input
                                                required
                                                type="text"
                                                value={pillarFormData.slug}
                                                onChange={e => setPillarFormData(prev => ({ ...prev, slug: e.target.value }))}
                                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-4 font-mono text-xs font-bold text-purple-600 dark:text-purple-400 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-left block">Structure Definition</label>
                                        <textarea
                                            value={pillarFormData.description}
                                            onChange={e => setPillarFormData(prev => ({ ...prev, description: e.target.value }))}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-4 h-32 text-sm font-medium resize-none dark:text-white transition-all"
                                            placeholder="What does this specific pillar represent?"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pillar Visual</label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setActiveImageTarget("pillar");
                                                    const q = pillarFormData.name || "";
                                                    setPexelsQuery(q);
                                                    setIsPexelsModalOpen(true);
                                                    searchPexels(1, q);
                                                }}
                                                className="flex items-center gap-2 text-teal-600 hover:text-teal-500 text-[10px] font-black uppercase tracking-widest"
                                            >
                                                <Search size={14} />
                                                Fetch from Pexels
                                            </button>
                                        </div>
                                        {pillarFormData.coverImage ? (
                                            <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10">
                                                <Image src={pillarFormData.coverImage} alt="Cover" fill className="object-cover" />
                                                <button 
                                                    type="button"
                                                    onClick={() => setPillarFormData({...pillarFormData, coverImage: ""})}
                                                    className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black transition-colors"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                                                <Image 
                                                    src={`https://placehold.co/600x400/2563eb/ffffff?text=${encodeURIComponent(pillarFormData.name || "Pillar")}`}
                                                    alt="Placeholder"
                                                    fill
                                                    className="object-cover opacity-60 grayscale transition-all"
                                                />
                                                <div className="relative z-10 flex flex-col items-center gap-2 text-gray-400">
                                                    <ImageIcon size={32} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">No Visual Assigned</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Visual Library */}
                                        {pillarFormData.pexelsImages && pillarFormData.pexelsImages.length > 0 && (
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Asset Gallery (Preselected Images)</label>
                                                <div className="grid grid-cols-4 gap-3">
                                                    {pillarFormData.pexelsImages.map((img, idx) => (
                                                        <div 
                                                            key={idx}
                                                            onClick={() => setPillarFormData({ ...pillarFormData, coverImage: img })}
                                                            className={cn(
                                                                "group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all",
                                                                pillarFormData.coverImage === img ? "border-purple-600 ring-4 ring-purple-600/10 scale-95" : "border-transparent opacity-70 hover:opacity-100 hover:scale-105"
                                                            )}
                                                        >
                                                            <Image src={img} alt="Library" fill className="object-cover" />
                                                            {pillarFormData.coverImage === img && (
                                                                <div className="absolute inset-0 bg-purple-600/10 flex items-center justify-center">
                                                                    <div className="bg-purple-600 rounded-full p-1 shadow-lg">
                                                                        <Check className="text-white" size={12} strokeWidth={4} />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const updated = pillarFormData.pexelsImages?.filter((_, i) => i !== idx);
                                                                    setPillarFormData({ 
                                                                        ...pillarFormData, 
                                                                        pexelsImages: updated,
                                                                        coverImage: pillarFormData.coverImage === img ? (updated?.[0] || "") : pillarFormData.coverImage
                                                                    });
                                                                }}
                                                                className="absolute top-1 right-1 p-1 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X size={8} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-purple-500/20 hover:bg-purple-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {isSubmitting && <Loader2 className="animate-spin" size={20} />}
                                        {editingPillar ? "Update Structure" : "Solidify Pillar"}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Pexels Visual Selection Modal */}
            <AnimatePresence>
                {isPexelsModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-12">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsPexelsModalOpen(false)}
                            className="absolute inset-0 bg-gray-950/90 backdrop-blur-2xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 40 }}
                            className="bg-white dark:bg-zinc-950 w-full max-w-6xl h-full max-h-[85vh] rounded-[3rem] shadow-huge border border-white/5 relative z-10 overflow-hidden flex flex-col"
                        >
                            {/* Pexels Header */}
                            <div className="p-8 pb-6 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md border-b border-gray-100 dark:border-white/5">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                                            <ImageIcon size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black dark:text-white">Visual Discovery</h2>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-teal-600">Curated Asset Library</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 max-w-lg relative group w-full">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Explore concepts (e.g. Brain, DNA, Future)..."
                                            value={pexelsQuery}
                                            onChange={(e) => setPexelsQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && searchPexels()}
                                            className="w-full pl-12 pr-28 py-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl font-bold dark:text-white focus:ring-2 focus:ring-teal-500/20"
                                        />
                                        <button
                                            onClick={() => searchPexels()}
                                            className="absolute right-2 top-2 bottom-2 px-6 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-700 transition-all"
                                        >
                                            Search
                                        </button>
                                    </div>

                                    <button onClick={() => setIsPexelsModalOpen(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                        <X size={28} />
                                    </button>
                                </div>
                            </div>

                            {/* Pexels Selection Bar */}
                            <AnimatePresence>
                                {selectedInModal.length > 0 && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="bg-teal-600/10 border-b border-teal-500/20 overflow-hidden"
                                    >
                                        <div className="px-8 py-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex -space-x-4">
                                                    {selectedInModal.slice(0, 8).map((url, i) => (
                                                        <div key={i} className="relative w-10 h-10 rounded-full border-2 border-white dark:border-zinc-950 overflow-hidden shadow-lg">
                                                            <Image src={url} alt="Selection" fill className="object-cover" />
                                                        </div>
                                                    ))}
                                                </div>
                                                <span className="text-xs font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">
                                                    {selectedInModal.length} Selection{selectedInModal.length > 1 ? 's' : ''} Ready
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setSelectedInModal([])} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500">Clear</button>
                                                <button
                                                    onClick={confirmPexelsSelection}
                                                    className="px-8 py-3 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-teal-500/20 hover:bg-teal-700 transition-all active:scale-95 flex items-center gap-2"
                                                >
                                                    Finalize Selections
                                                    <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Pexels Scrollable Grid */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative" data-lenis-prevent="true">
                                {isSearchingPexels ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {Array.from({ length: 12 }).map((_, i) => (
                                            <div key={i} className="relative aspect-[4/3] rounded-3xl bg-gray-100 dark:bg-white/5 overflow-hidden">
                                                <motion.div
                                                    animate={{ x: ["-100%", "100%"] }}
                                                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : pexelsImages.length > 0 ? (
                                    <div className="space-y-12">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                                            {pexelsImages.map((img, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => toggleModalImage(img)}
                                                    className={cn(
                                                        "group relative aspect-[4/3] rounded-3xl overflow-hidden cursor-pointer border-2 transition-all duration-300",
                                                        selectedInModal.includes(img) 
                                                            ? "border-teal-500 ring-4 ring-teal-500/10 scale-[0.98]" 
                                                            : "border-transparent hover:border-teal-500/40"
                                                    )}
                                                >
                                                    <Image src={img} alt="Pexels" fill className="object-cover transition-transform group-hover:scale-105" />
                                                    <div className={cn(
                                                        "absolute inset-0 flex items-center justify-center transition-all",
                                                        selectedInModal.includes(img) ? "bg-teal-600/40 opacity-100" : "bg-black/20 opacity-0 group-hover:opacity-100"
                                                    )}>
                                                        {selectedInModal.includes(img) ? (
                                                            <div className="w-12 h-12 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-2xl">
                                                                <Check size={28} strokeWidth={3} />
                                                            </div>
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center">
                                                                <Plus size={24} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Pagination */}
                                        <div className="flex items-center justify-center gap-3 pb-10">
                                            {Array.from({ length: 4 }).map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => searchPexels(i + 1)}
                                                    className={cn(
                                                        "w-12 h-12 rounded-2xl border-2 font-black text-xs transition-all",
                                                        pexelsPage === i + 1
                                                            ? "bg-teal-600 border-teal-600 text-white shadow-xl shadow-teal-600/20"
                                                            : "bg-white dark:bg-zinc-900 border-gray-100 dark:border-white/10 text-gray-400 hover:border-teal-600/50"
                                                    )}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-20">
                                        <ImageIcon size={64} strokeWidth={1} />
                                        <p className="text-xl font-bold mt-4 uppercase tracking-[0.2em]">Enter search query to explore imagery</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
