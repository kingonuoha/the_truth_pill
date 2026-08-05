import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { ArticleContent } from "./article-content";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOgImageUrl, truncate } from "@/lib/utils";
import { getCanonical, getSiteUrl } from "@/lib/site-url";

export const revalidate = 60; // ISR: Revalidate every 60 seconds

interface ArticlePageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
    const { slug } = await params;
    const article = await fetchQuery(api.articles.getBySlug, { slug });

    if (!article) {
        return {
            title: "Article Not Found",
        };
    }

    // SEO Standards: Priority to Focus Keyword + Tags
    const tagsArray = article.tags || [];
    const focusKeyword = article.focusKeyword;
    
    let description = article.excerpt || "A deep dive into psychology and human behavior.";
    
    if (focusKeyword || tagsArray.length > 0) {
        const parts = [
            focusKeyword,
            ...tagsArray.slice(0, 3)
        ].filter(Boolean);
        
        if (parts.length > 0) {
            description = `${parts.join(", ")} - ${truncate(description, 100)}`;
        }
    }

    description = truncate(description, 155);
    const title = truncate(article.title, 60);
    const image = article.coverImage || getOgImageUrl(article.title);

    return {
        title,
        description,
        alternates: {
            canonical: getCanonical(slug),
        },
        openGraph: {
            title,
            description,
            images: [
                {
                    url: image,
                    width: 1200,
                    height: 630,
                    alt: article.title,
                },
            ],
            type: "article",
            publishedTime: new Date(article.publishedAt || article.createdAt).toISOString(),
            authors: [article.authorName],
            tags: tagsArray,
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [image],
        },
    };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
    const { slug } = await params;
    const article = await fetchQuery(api.articles.getBySlug, { slug });

    if (!article) {
        notFound();
    }

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": article.title,
        "description": article.excerpt,
        "image": article.coverImage,
        "datePublished": new Date(article.publishedAt || article.createdAt).toISOString(),
        "dateModified": new Date(article.updatedAt || article.createdAt).toISOString(),
        "author": {
            "@type": "Person",
            "name": article.authorName,
        },
        "publisher": {
            "@type": "Organization",
            "name": "The Truth Pill",
            "logo": {
                "@type": "ImageObject",
                "url": `${getSiteUrl()}/truthpill/logo-text-hor-dark.png`,
            },
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": getCanonical(slug),
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ArticleContent initialArticle={article} slug={slug} />
        </>
    );
}
