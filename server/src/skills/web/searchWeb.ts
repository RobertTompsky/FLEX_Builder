import z from "zod"

export const newsSearchSchema = z.object({
    query: z
        .string()
        .min(1)
        .describe("News/search query, e.g. 'bitcoin spot ETF flows'"),
})

export const searchWeb = async ({ query }: z.infer<typeof newsSearchSchema>) => {
    const apiKey = process.env.TAVILY_API_KEY

    if (!apiKey) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Tavily API key is not set',
                }
            ]
        }
    }

    const safeQuery = query?.trim();
    if (!safeQuery) {
        console.warn("[searchWeb] missing query");
        return {
            content: [
                {
                    type: 'text',
                    text: 'News search error: query is required',
                }
            ],
            isError: true
        }
    }

    const body = {
        query: safeQuery,
        topic: 'news',
        search_depth: 'basic',
        max_results: 6,
        days: 1,
        include_answer: true
    }

    try {
        const res = await fetch("https://api.tavily.com/search", {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })

        const contentType = res.headers.get("content-type") ?? "";
        const rawText = await res.text();

        if (!res.ok) {
            const preview = rawText.slice(0, 500);
            console.warn("[searchWeb] non-OK response", {
                status: res.status,
                statusText: res.statusText,
                contentType,
                preview
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to search news: ${res.status} ${res.statusText}`,
                    }
                ],
                isError: true
            }
        }

        interface TavilySource {
            url: string;
            title: string;
            content: string;
            raw_content?: string;
            published_date: string
        }
        interface TavilyResponse {
            answer?: string;
            results: TavilySource[];
        }

        let data: TavilyResponse | null = null;
        try {
            data = JSON.parse(rawText) as TavilyResponse;
        } catch (err) {
            const preview = rawText.slice(0, 500);
            console.error("[searchWeb] JSON parse failed", {
                contentType,
                preview,
                error: String(err)
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: `News search error: Invalid JSON response from Tavily`,
                    }
                ],
                isError: true
            }
        }

        const answer = data?.answer;
        const results = Array.isArray(data?.results) ? data!.results : [];

        if (!results.length) {
            console.warn("[searchWeb] empty results", { query });
            return {
                content: [
                    {
                        type: 'text',
                        text: `No news found for query: "${query}". Try refining the query.`,
                    }
                ]
            }
        }

        const digest = [
            answer ?? 'No preview answer',
            ...results.map((r, i) => `[${i + 1}]: ${r.url}\n${r.content}`)
        ].join('\n')

        const links = results.map((r) => ({
            type: 'resource_link' as const,
            name: r.title ?? r.url,
            uri: r.url
        }))

        return {
            content: [
                {
                    type: 'text',
                    text: digest
                },
                ...links
            ]
        }
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `News search error: ${String(error)}`,
                }
            ],
            isError: true
        }
    }
}