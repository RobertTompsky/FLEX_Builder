import z from "zod"

export const newsInputSchema = z.object({
    query: z
        .string()
        .min(1)
        .describe("News/search query, e.g. 'bitcoin spot ETF flows'"),
})

export const newsOutputSchema = z.object({
    query: z.string(),
    answer: z.string().optional(),
    results: z.array(
        z.object({
            title: z.string(),
            url: z.url(),
            content: z.string(),
            publishedDate: z.string().optional(),
        }),
    ),
});

type NewsInput = z.infer<typeof newsInputSchema>;
type NewsOutput = z.infer<typeof newsOutputSchema>;

interface TavilySource {
    url: string;
    title?: string;
    content?: string;
    raw_content?: string;
    published_date?: string;
}

interface TavilyResponse {
    answer?: string;
    results?: TavilySource[];
}

export const searchWeb = async ({
    query,
}: NewsInput): Promise<NewsOutput> => {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
        throw new Error("Tavily API key is not set");
    }

    const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query,
            topic: "news",
            search_depth: "basic",
            max_results: 6,
            days: 1,
            include_answer: true,
        }),
    });

    const rawText = await res.text();

    if (!res.ok) {
        console.warn("[searchWeb] non-OK response", {
            status: res.status,
            statusText: res.statusText,
            preview: rawText.slice(0, 500),
        });

        throw new Error(
            `Failed to search news: ${res.status} ${res.statusText}`,
        );
    }

    let response: TavilyResponse;

    try {
        response = JSON.parse(rawText) as TavilyResponse;
    } catch (error) {
        console.error("[searchWeb] JSON parse failed", {
            preview: rawText.slice(0, 500),
            error: String(error),
        });

        throw new Error("Invalid JSON response from Tavily");
    }

    return newsOutputSchema.parse({
        query,
        answer: response.answer,
        results: (response.results ?? []).map((result) => ({
            title: result.title ?? "Untitled source",
            url: result.url,
            content: result.content ?? "",
            publishedDate: result.published_date,
        })),
    });
};