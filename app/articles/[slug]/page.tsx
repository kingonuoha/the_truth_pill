import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { ArticleContent } from "./article-content";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 60; // ISR: Revalidate every 60 seconds

interface ArticlePageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
    const { slug } = await params;
    const article = await fetchQuery(api.articles.getBySlug, { slug });

    if (!article) {
        return {
            title: "Article Not Found | The Truth Pill",
        };
    }

    const title = `${article.title} | The Truth Pill`;
    const description = article.excerpt || "A deep dive into psychology and human behavior.";
    const image = article.coverImage || "https://thetruthpill.com/og-image.png";

    return {
        title,
        description,
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
                "url": "https://thetruthpill.com/logo.png",
            },
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://thetruthpill.com/articles/${slug}`,
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
