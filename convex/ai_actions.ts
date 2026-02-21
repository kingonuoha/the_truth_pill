import { v } from "convex/values";
import { action } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";
import { AI_CONFIG } from "./ai_prompts";

export const fetchModels = action({
  args: {
    provider: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      if (args.provider === "openai") {
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: {
            Authorization: `Bearer ${args.apiKey}`,
          },
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(
            error.error?.message || `OpenAI error: ${response.statusText}`,
          );
        }

        const data = await response.json();
        // Filter for chat models to keep the list clean
        return (data.data as { id: string }[])
          .filter((m) => m.id.startsWith("gpt-") || m.id.startsWith("o1-"))
          .map((m) => m.id)
          .sort();
      }

      if (args.provider === "gemini") {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${args.apiKey}`,
        );

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(
            error.error?.message || `Gemini error: ${response.statusText}`,
          );
        }

        const data = await response.json();
        return (
          data.models as {
            name: string;
            supportedGenerationMethods: string[];
          }[]
        )
          .filter((m) =>
            m.supportedGenerationMethods.includes("generateContent"),
          )
          .map((m) => m.name.replace("models/", ""))
          .sort();
      }

      return [];
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch models";
      console.error("AI Fetch Models Error:", error);
      throw new Error(message);
    }
  },
});

export const testConnection = action({
  args: {
    provider: v.string(),
    apiKey: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      if (args.provider === "openai") {
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${args.apiKey}`,
            },
            body: JSON.stringify({
              model: args.model,
              messages: [
                { role: "user", content: "Say 'Connection Successful'" },
              ],
              max_tokens: 10,
            }),
          },
        );

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error?.message || "OpenAI connection failed");
        }
        return { success: true, message: "OpenAI connection successful" };
      }

      if (args.provider === "gemini") {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${args.model}:generateContent?key=${args.apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Say 'Connection Successful'" }] }],
            }),
          },
        );

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error?.message || "Gemini connection failed");
        }
        return { success: true, message: "Gemini connection successful" };
      }

      throw new Error("Unsupported provider");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Connection test failed";
      return { success: false, message };
    }
  },
});

export const generateContent = action({
  args: {
    provider: v.string(),
    apiKey: v.string(),
    model: v.string(),
    prompt: v.string(),
    systemPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string> => {
    try {
      if (args.provider === "openai") {
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${args.apiKey}`,
            },
            body: JSON.stringify({
              model: args.model,
              messages: [
                ...(args.systemPrompt
                  ? [{ role: "system", content: args.systemPrompt }]
                  : []),
                { role: "user", content: args.prompt },
              ],
              temperature: 0.7,
            }),
          },
        );

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error?.message || "OpenAI generation failed");
        }
        const data = await response.json();
        return data.choices[0].message.content;
      }

      if (args.provider === "gemini") {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${args.model}:generateContent?key=${args.apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `${args.systemPrompt ? args.systemPrompt + "\n\n" : ""}${args.prompt}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.7,
              },
            }),
          },
        );

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error?.message || "Gemini generation failed");
        }
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
      }

      throw new Error("Unsupported provider");
    } catch (error) {
      console.error("AI Generation Error:", error);
      const message =
        error instanceof Error ? error.message : "Generation failed";
      throw new Error(message);
    }
  },
});

export const generateArticleFromTopic = action({
  args: {
    provider: v.string(),
    apiKey: v.string(),
    model: v.string(),
    topic: v.string(),
    systemPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const config = AI_CONFIG.articleGeneration;
    const prompt = config.userPrompt(args.topic, args.systemPrompt);
    const systemPrompt = config.systemPrompt;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { topic: _, systemPrompt: __, ...restArgs } = args;
    const response = await ctx.runAction(api.ai_actions.generateContent, {
      ...restArgs,
      prompt,
      systemPrompt,
    });

    console.log("AI Article Raw Response:", response);

    try {
      // More robust JSON extraction - find the first { and last }
      const firstBrace = response.indexOf("{");
      const lastBrace = response.lastIndexOf("}");
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error("No JSON object found in AI response");
      }
      const jsonStr = response.substring(firstBrace, lastBrace + 1);
      const data = JSON.parse(jsonStr);

      // Validate required fields
      const required = ["title", "content", "excerpt"];
      for (const field of required) {
        if (!data[field])
          throw new Error(`AI response missing required field: ${field}`);
      }

      await ctx.runMutation(internal.articles.saveAIDraft, {
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        tags: data.tags || [],
        topic: args.topic,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        focusKeyword: data.focusKeyword,
      });

      // Mark the research topic as processed if it exists
      await ctx.runMutation(api.ai.markTopicAsProcessed, { topic: args.topic });

      return { success: true };
    } catch (err) {
      console.error("AI Generation Error Details:", err);
      throw new Error(
        `AI generated content but it couldn't be processed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  },
});
export const learnAuthorStyle = action({
  args: {
    provider: v.string(),
    apiKey: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    const articles = await ctx.runQuery(api.articles.list, { limit: 3 });
    if (articles.length === 0) {
      throw new Error("No articles found to learn style from");
    }

    const contentSample = articles
      .map(
        (a: Doc<"articles">) =>
          `TITLE: ${a.title}\nCONTENT: ${a.content?.substring(0, 1000)}`,
      )
      .join("\n\n---\n\n");

    const config = AI_CONFIG.authorAnalysis;
    const prompt = config.userPrompt(contentSample);

    return await ctx.runAction(api.ai_actions.generateContent, {
      ...args,
      prompt,
      systemPrompt: config.systemPrompt,
    });
  },
});

export const shuffleTopics = action({
  args: {
    provider: v.string(),
    apiKey: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const categories = await ctx.runQuery(api.categories.listAll);
    if (categories.length === 0) {
      throw new Error("No categories found");
    }

    const catNames = categories
      .map((c: Doc<"categories">) => c.name)
      .join(", ");
    const config = AI_CONFIG.topicSuggestions;
    const prompt = config.userPrompt(catNames);

    const response = await ctx.runAction(api.ai_actions.generateContent, {
      ...args,
      prompt,
      systemPrompt: config.systemPrompt,
    });

    try {
      const firstBrace = response.indexOf("{");
      const lastBrace = response.lastIndexOf("}");
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error("No JSON object found in AI response");
      }
      const jsonStr = response.substring(firstBrace, lastBrace + 1);
      const data = JSON.parse(jsonStr);
      return data.suggestions || [];
    } catch (err) {
      console.error("AI Topic Shuffle Parse Error:", response);
      throw new Error(
        `Failed to parse AI topic suggestions: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  },
});
