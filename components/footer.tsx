"use client";

import Link from "next/link";
import { Github, Twitter, Linkedin, Mail, Heart } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-zinc-900 text-white py-20 px-6 mt-32">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 border-b border-zinc-800 pb-20">
                    {/* Brand Section */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">T</div>
                            <span className="font-serif text-2xl font-bold tracking-tight text-white">The Truth Pill</span>
                        </Link>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-6 max-w-xs">
                            Deep dives into the human psyche, uncovering the hidden patterns of behavior and the foundations of a meaningful life.
                        </p>
                        <div className="flex items-center gap-4">
                            {[Twitter, Github, Linkedin, Mail].map((Icon, idx) => (
                                <a key={idx} href="#" className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all duration-300">
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links - Platform */}
                    <div>
                        <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-white mb-8">Platform</h4>
                        <ul className="space-y-4 text-sm text-zinc-400 font-medium">
                            <li><Link href="/articles" className="hover:text-primary transition-colors">Latest Articles</Link></li>
                            <li><Link href="/categories" className="hover:text-primary transition-colors">Categories</Link></li>
                            <li><Link href="/featured" className="hover:text-primary transition-colors">Featured Insights</Link></li>
                            <li><Link href="/authors" className="hover:text-primary transition-colors">Our Authors</Link></li>
                        </ul>
                    </div>

                    {/* Links - Company */}
                    <div>
                        <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-white mb-8">Resources</h4>
                        <ul className="space-y-4 text-sm text-zinc-400 font-medium">
                            <li><Link href="/about" className="hover:text-primary transition-colors">About the Mission</Link></li>
                            <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Wisdom</Link></li>
                            <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter Section */}
                    <div className="lg:col-span-1">
                        <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-white mb-8">The Weekly dose</h4>
                        <p className="text-zinc-400 text-sm mb-6">Join 50,000+ others seeking the truth in their inbox.</p>
                        <form className="relative group">
                            <input
                                type="email"
                                placeholder="Email address"
                                className="w-full bg-zinc-800 border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                            <button className="absolute right-2 top-2 bottom-2 bg-primary text-white rounded-xl px-4 text-xs font-bold uppercase tracking-widest hover:bg-sky-400 transition-colors">
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                <div className="pt-10 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <p>© {new Date().getFullYear()} The Truth Pill. All rights reserved.</p>
                    <div className="flex items-center gap-2">
                        <span>Crafted with</span>
                        <Heart size={12} className="text-red-500 fill-red-500 animate-pulse" />
                        <span>for humanity</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
