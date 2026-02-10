"use client";

import { Navbar } from "@/components/navbar";
import { HeroCarousel } from "@/components/hero-carousel";
import { BlogGrid } from "@/components/blog-grid";
import { CategoryShowcase } from "@/components/category-showcase";
import { Newsletter } from "@/components/newsletter";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Immersive Hero Section */}
      <section className="relative">
        <HeroCarousel />
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-zinc-50/50">
        <div className="max-w-7xl mx-auto px-6 mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-6">
            Explore Truths
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">Navigate by Reality</h2>
          <p className="text-zinc-500 font-medium max-w-xl mx-auto">
            Dive deeper into the areas of psychology and philosophy that shape your existence.
          </p>
        </div>
        <CategoryShowcase />
      </section>

      {/* Main Content Sections */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto pt-24 px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Latest Insights</h2>
              <div className="w-20 h-1 bg-sky-blue rounded-full" />
            </div>
          </div>
        </div>
        <BlogGrid />
      </section>

      {/* Newsletter Signup */}
      <div className="max-w-7xl mx-auto px-6 mb-24">
        <Newsletter />
      </div>

    </main>
  );
}
