"use client";

import { Doc } from "@/convex/_generated/dataModel";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, BookOpen, Clock, User, Facebook, Twitter, Instagram, Mail } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

interface JoinedArticle extends Doc<"articles"> {
    categoryName: string;
    authorName?: string;
    authorImage?: string;
}

interface AuthorContentProps {
    author: Doc<"users">;
    initialArticles: JoinedArticle[];
}

export function AuthorContent({ author, initialArticles }: AuthorContentProps) {
    return (
        <div className="min-h-screen bg-zinc-50">
            <Navbar theme="dark" />

            {/* Header / Cover Section */}
            <div className="relative h-64 md:h-80 bg-zinc-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-zinc-900" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-50 to-transparent" />
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-32 relative z-10 pb-20">
                <div className="flex flex-col md:flex-row gap-10">
                    {/* Sidebar / Profile Info */}
                    <div className="w-full md:w-80 shrink-0">
                        <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-zinc-200/50 border border-zinc-100 sticky top-24">
                            <div className="relative w-32 h-32 mx-auto mb-6">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-full blur-lg opacity-20 animate-pulse" />
                                <div className="relative w-full h-full rounded-full border-4 border-white shadow-xl overflow-hidden bg-zinc-100">
                                    {author.profileImage ? (
                                        <Image
                                            src={author.profileImage}
                                            alt={author.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400">
                                            <User size={48} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-serif font-bold text-zinc-900 mb-1">{author.name}</h1>
                                <p className="text-primary font-bold text-xs uppercase tracking-widest px-3 py-1 bg-primary/5 rounded-full inline-block">
                                    {author.role === 'admin' ? 'Verified Author' : 'Contributor'}
                                </p>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3 text-sm text-zinc-500">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
                                        <BookOpen size={16} />
                                    </div>
                                    <span className="font-medium">{initialArticles.length} Articles Published</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-zinc-500">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
                                        <Calendar size={16} />
                                    </div>
                                    <span className="font-medium">Joined {new Date(author.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-zinc-500">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
                                        <Mail size={16} />
                                    </div>
                                    <span className="font-medium truncate">{author.email}</span>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-zinc-100">
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 text-center">Follow Author</p>
                                <div className="flex justify-center gap-4">
                                    <a href="#" className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-primary hover:bg-primary/5 transition-all group">
                                        <Facebook size={18} className="group-hover:scale-110 transition-transform" />
                                    </a>
                                    <a href="#" className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-primary hover:bg-primary/5 transition-all group">
                                        <Twitter size={18} className="group-hover:scale-110 transition-transform" />
                                    </a>
                                    <a href="#" className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-primary hover:bg-primary/5 transition-all group">
                                        <Instagram size={18} className="group-hover:scale-110 transition-transform" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content / Articles */}
                    <div className="flex-1 space-y-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-3xl font-serif font-bold text-zinc-900 italic">Latest Truths</h2>
                            <div className="h-px flex-1 bg-zinc-200 mx-8 hidden md:block" />
                            <p className="text-zinc-500 text-sm font-medium">{initialArticles.length} Results</p>
                        </div>

                        {initialArticles.length === 0 ? (
                            <div className="bg-white rounded-3xl p-12 text-center border border-zinc-100 shadow-sm">
                                <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-300 mx-auto mb-4">
                                    <BookOpen size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 mb-2">No articles yet</h3>
                                <p className="text-zinc-500">This author hasn&apos;t published any articles yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-8">
                                {initialArticles.map((article: JoinedArticle, idx: number) => (
                                    <motion.article
                                        key={article._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="group bg-white rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row gap-8 shadow-lg shadow-zinc-200/40 border border-zinc-100/50 hover:shadow-xl hover:shadow-primary/5 transition-all"
                                    >
                                        <Link href={`/articles/${article.slug}`} className="relative w-full md:w-64 h-48 rounded-2xl overflow-hidden shrink-0">
                                            <Image
                                                src={article.coverImage || ""}
                                                alt={article.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                            <div className="absolute top-3 left-3 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
                                                {article.categoryName}
                                            </div>
                                        </Link>

                                        <div className="flex flex-col py-2">
                                            <Link href={`/articles/${article.slug}`}>
                                                <h3 className="text-2xl font-serif font-bold text-zinc-900 mb-3 group-hover:text-primary transition-colors leading-tight">
                                                    {article.title}
                                                </h3>
                                            </Link>
                                            <p className="text-zinc-500 text-sm leading-relaxed mb-6 line-clamp-2 md:line-clamp-3">
                                                {article.excerpt}
                                            </p>
                                            <div className="mt-auto flex items-center gap-6">
                                                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                                                    <Calendar size={14} className="text-primary/60" />
                                                    {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                                                    <Clock size={14} className="text-secondary/60" />
                                                    {article.readingTime} min read
                                                </div>
                                            </div>
                                        </div>
                                    </motion.article>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
