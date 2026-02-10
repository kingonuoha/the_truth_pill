import Link from "next/link";
import Image from "next/image";
import { Calendar, User } from "lucide-react";

interface Article {
    id: string;
    title: string;
    excerpt: string;
    coverImage: string;
    category: string;
    author: string;
    date: string;
    slug: string;
}

const MOCK_ARTICLES: Article[] = [
    {
        id: "1",
        title: "The Unseen Power - How Observation Can Save and Guide You",
        excerpt: "Mrs. Ijeoma, a retired nurse right here on a street in Owerri, noticed something strange about a new...",
        coverImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600",
        category: "Life Skills",
        author: "Sandra Opara",
        date: "September 1, 2025",
        slug: "the-unseen-power",
    },
    {
        id: "2",
        title: "The Path of a Lifetime: Stop Rushing Your Journey",
        excerpt: "Ever asked yourself, 'What exactly is this thing called life?' You're not alone. We've all been the...",
        coverImage: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=600",
        category: "Life Lessons",
        author: "Sandra Opara",
        date: "August 28, 2025",
        slug: "stop-rushing",
    },
    {
        id: "3",
        title: "Don't Let the World Drown You: Guard Your Peace",
        excerpt: "These days, bad news doesn't knock—it barges in, loud and unfiltered. From global conflicts to a str...",
        coverImage: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=600",
        category: "Stress Management",
        author: "Sandra Opara",
        date: "August 15, 2025",
        slug: "guard-your-peace",
    },
    {
        id: "4",
        title: "LOVE THOSE WHO LOVE YOU!",
        excerpt: "Why Do We Keep Loving People Who Don't Love Us Back? Hi friends, let's talk about that one perso...",
        coverImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600",
        category: "Healthy Relationships",
        author: "Sandra Opara",
        date: "August 1, 2025",
        slug: "love-those-who-love-you",
    },
    {
        id: "5",
        title: "THE POWER OF VULNERABILITY",
        excerpt: "Hey friends, let's talk about the power of vulnerability. Some moments in life just hit differently ...",
        coverImage: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=600",
        category: "Anxiety Therapy",
        author: "Sandra Opara",
        date: "June 2, 2025",
        slug: "power-of-vulnerability",
    },
    {
        id: "6",
        title: "FINDING SERENITY AMIDST THE STORM",
        excerpt: "In the intricate dance of love, relationships often encounter turbulent waters. Whether it's due to ...",
        coverImage: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&q=80&w=600",
        category: "Depression Therapy",
        author: "Sandra Opara",
        date: "February 26, 2025",
        slug: "finding-serenity",
    }
];

export function BlogGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-6 py-20 max-w-7xl mx-auto">
            {MOCK_ARTICLES.map((article) => (
                <article key={article.id} className="group flex flex-col items-start gap-4">
                    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-sm">
                        <Image
                            src={article.coverImage}
                            alt={article.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute top-4 right-4">
                            <span className="category-badge">
                                {article.category}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Link href={`/articles/${article.slug}`}>
                            <h2 className="text-xl font-serif font-bold leading-tight group-hover:text-primary transition-colors uppercase">
                                {article.title}
                            </h2>
                        </Link>
                        <p className="text-zinc-600 text-sm line-clamp-2 leading-relaxed">
                            {article.excerpt}
                        </p>
                    </div>

                    <div className="flex items-center gap-6 mt-2 py-2 px-3 glass-card rounded-lg w-full">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-200 border-2 border-sky-blue/20">
                                <div className="bg-primary/20 w-full h-full flex items-center justify-center">
                                    <User size={12} className="text-sky-blue" />
                                </div>
                            </div>
                            <span className="text-[11px] font-bold text-foreground/80">{article.author}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar size={12} className="text-school-purple/60" />
                            <span className="text-[11px] font-medium text-foreground/60">{article.date}</span>
                        </div>
                    </div>
                </article>
            ))}
        </div>
    );
}
