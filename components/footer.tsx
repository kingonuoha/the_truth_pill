"use client";

import Link from "next/link";
import { Github, Twitter, Linkedin, Mail, Heart, Loader2 } from "lucide-react";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export function Footer() {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const subscribe = useMutation(api.users.subscribeToNewsletter);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsSubmitting(true);
        try {
            const result = (await subscribe({ email })) as { status: string };
            setEmail("");

            if (result.status === "invited") {
                toast.success("Check your email", {
                    description: "We've sent you an invitation to create an account and join the circle.",
                });
            } else {
                toast.success("Welcome to the circle", {
                    description: "Your weekly dose of truth is on its way.",
                });
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to subscribe");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <footer className="bg-gray-950 text-white py-24 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-12 border-b border-gray-900 pb-16">
                    {/* Brand Section */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="flex items-center gap-2.5 mb-8 group">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl transition-transform group-hover:scale-105">T</div>
                            <span className="font-serif text-2xl font-black tracking-tight text-white">The Truth Pill</span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed mb-10 max-w-xs font-medium">
                            Deciphering the human experience through deep psychological research and unfiltered insights.
                        </p>
                        <div className="flex items-center gap-4">
                            {[Twitter, Github, Linkedin, Mail].map((Icon, idx) => (
                                <a key={idx} href="#" className="p-2.5 rounded-xl bg-gray-900 text-gray-400 hover:text-white hover:bg-blue-600 transition-all duration-300">
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links - Platform */}
                    <div>
                        <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-blue-500 mb-8">Platform</h4>
                        <ul className="space-y-4 text-sm text-gray-400 font-semibold">
                            <li><Link href="/articles" className="hover:text-blue-500 transition-colors">Latest Articles</Link></li>
                            <li><Link href="/categories" className="hover:text-blue-500 transition-colors">Navigation by Reality</Link></li>
                            <li><Link href="/featured" className="hover:text-blue-500 transition-colors">Featured Discoveries</Link></li>
                            <li><Link href="/authors" className="hover:text-blue-500 transition-colors">Our Ethos</Link></li>
                        </ul>
                    </div>

                    {/* Links - Company */}
                    <div>
                        <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-blue-500 mb-8">Methodology</h4>
                        <ul className="space-y-4 text-sm text-gray-400 font-semibold">
                            <li><Link href="/about" className="hover:text-blue-500 transition-colors">About the Mission</Link></li>
                            <li><Link href="/privacy" className="hover:text-blue-500 transition-colors">Privacy Paradigm</Link></li>
                            <li><Link href="/terms" className="hover:text-blue-500 transition-colors">Terms of Wisdom</Link></li>
                            <li><Link href="/contact" className="hover:text-blue-500 transition-colors">Secure Contact</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter Section */}
                    <div className="lg:col-span-1">
                        <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-blue-500 mb-8">The Circle</h4>
                        <p className="text-gray-400 text-sm mb-6 font-medium">Join 50,000+ others seeking the truth in their inbox.</p>
                        <form onSubmit={handleSubmit} className="relative group">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email address"
                                required
                                disabled={isSubmitting}
                                className="w-full bg-gray-900 border border-gray-800 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-blue-600/50 transition-all disabled:opacity-50 font-medium"
                            />
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white rounded-xl px-4 text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors disabled:bg-gray-800 flex items-center justify-center min-w-[100px]"
                            >
                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Subscribe"}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="pt-12 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                    <p>© {new Date().getFullYear()} The Truth Pill. Unfiltered Evolution.</p>
                    <div className="flex items-center gap-2">
                        <span>Crafted with</span>
                        <Heart size={12} className="text-blue-600 fill-blue-600 animate-pulse" />
                        <span>for humanity</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
