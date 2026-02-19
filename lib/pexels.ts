/**
 * Pexels API Service
 * Fetches high-quality dynamic images for categories and articles.
 */

const PEXELS_URL = "https://api.pexels.com/v1";

export async function getDynamicImage(query: string): Promise<string> {
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    console.warn(
      "PEXELS_API_KEY is missing. Falling back to Unsplash placeholders.",
    );
    return `https://images.unsplash.com/photo-1579546123306-9e3eb6a5fb7f?q=80&w=1000&auto=format&fit=crop`; // Generic blurred fallback
  }

  try {
    const response = await fetch(
      `${PEXELS_URL}/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      {
        headers: {
          Authorization: apiKey,
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      },
    );

    if (!response.ok) throw new Error("Pexels API error");

    const data = await response.json();

    if (data.photos && data.photos.length > 0) {
      // Pick a random image from the first 5 results for variety
      const randomIndex = Math.floor(
        Math.random() * Math.min(data.photos.length, 5),
      );
      return data.photos[randomIndex].src.large2x;
    }

    return "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1000&auto=format&fit=crop"; // Default tech/blog fallback
  } catch (error) {
    console.error("Error fetching Pexels image:", error);
    return "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1000&auto=format&fit=crop";
  }
}
