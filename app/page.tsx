import { Navbar } from "@/components/navbar";
import { HeroCarousel } from "@/components/hero-carousel";
import { BlogGrid } from "@/components/blog-grid";
import { CategoryShowcase } from "@/components/category-showcase";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Immersive Hero Section */}
      <section className="relative">
        <HeroCarousel />
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-zinc-50/50">
        <div className="max-w-7xl mx-auto px-6 mb-10 text-center">
          <h2 className="text-3xl font-serif font-bold mb-4">Explore by Sentiment</h2>
          <p className="text-zinc-500 font-light">Divide deeper into the areas of psychology that move you.</p>
        </div>
        <CategoryShowcase />
      </section>

      {/* Main Content Sections */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto pt-20 px-6">
          <h2 className="text-2xl font-serif font-bold mb-2">Our Latest Blog Posts</h2>
          <div className="w-12 h-1 bg-primary mb-10" />
        </div>
        <BlogGrid />
      </section>

      {/* Footer */}
      <footer className="bg-zinc-50 border-t py-20 px-6 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">T</div>
              <span className="font-serif text-2xl font-bold">The Truth Pill</span>
            </div>
            <p className="text-zinc-500 max-w-sm text-sm">
              Helping you live a full life and become a better human to yourself and everyone around you.
            </p>
          </div>

          <div className="flex gap-10 text-sm font-medium">
            <div className="flex flex-col gap-3">
              <h4 className="font-bold">Platform</h4>
              <a href="#" className="text-zinc-500 hover:text-primary transition-colors">Articles</a>
              <a href="#" className="text-zinc-500 hover:text-primary transition-colors">Categories</a>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="font-bold">Company</h4>
              <a href="#" className="text-zinc-500 hover:text-primary transition-colors">About Us</a>
              <a href="#" className="text-zinc-500 hover:text-primary transition-colors">Newsletter</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
