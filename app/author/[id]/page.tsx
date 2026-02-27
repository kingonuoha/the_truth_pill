import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { Metadata } from "next";
import { AuthorContent } from "./author-content";

export const revalidate = 60; // ISR: Revalidate every 60 seconds

interface AuthorPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
    const { id } = await params;
    const author = await fetchQuery(api.users.getUserById, { id: id as Id<"users"> });

    if (!author) {
        return {
            title: "Author Not Found | The Truth Pill",
        };
    }

    return {
        title: `${author.name} | The Truth Pill`,
        description: `Explore insights and wisdom from ${author.name} on Psychology and Human Behavior.`,
        openGraph: {
            title: `${author.name} | Verified Author`,
            description: `A collection of articles and reflections by ${author.name}.`,
            images: author.profileImage ? [{ url: author.profileImage }] : [],
        },
    };
}

export default async function AuthorProfilePage({ params }: AuthorPageProps) {
    const { id } = await params;
    const authorId = id as Id<"users">;

    const author = await fetchQuery(api.users.getUserById, { id: authorId });
    const articles = await fetchQuery(api.articles.getByAuthor, { authorId });

    if (!author) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-serif font-bold text-zinc-900 mb-4">Author Not Found</h1>
                    <Link href="/" className="text-primary font-bold hover:underline">Return to Home</Link>
                </div>
            </div>
        );
    }

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "mainEntity": {
            "@type": "Person",
            "name": author.name,
            "description": `Verified Author at The Truth Pill`,
            "image": author.profileImage,
            "url": `https://thetruthpill.org/author/${id}`,
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <AuthorContent author={author} initialArticles={articles} />
        </>
    );
}
