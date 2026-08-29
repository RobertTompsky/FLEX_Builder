import { z } from "zod";
import { chromium } from "playwright";
import TurndownService from "turndown";
import { action } from "../../runtime/execute";

const BrowserOpenInputSchema =
    z.object({
        url: z
            .url(),

        format: z
            .enum([
                "markdown",
                "html",
            ])
            .default("markdown"),

        waitUntil: z
            .enum([
                "load",
                "domcontentloaded",
                "networkidle",
                "commit",
            ])
            .default("domcontentloaded"),

        timeout: z
            .number()
            .int()
            .positive()
            .max(60_000)
            .default(30_000),
    });

const BrowserOpenOutputSchema =
    z.object({
        url: z.string(),

        title: z.string(),

        format: z.enum([
            "markdown",
            "html",
        ]),

        content: z.string(),
    });

export const open = action({
    description: "Open a web page in a browser and return its rendered content as Markdown or HTML.",
    inputSchema: BrowserOpenInputSchema,
    outputSchema: BrowserOpenOutputSchema,
    async handler({
        url,
        format,
        waitUntil,
        timeout,
    }) {
        const browser = await chromium.launch({
            headless: true,
        });

        try {
            const page = await browser.newPage();

            const response = await page.goto(
                url,
                {
                    waitUntil,
                    timeout,
                },
            );

            if (!response) {
                throw new Error(
                    `Failed to open ${url}`,
                );
            }

            if (!response.ok()) {
                throw new Error(
                    `Failed to open ${url}: ${response.status()} ${response.statusText()}`,
                );
            }

            const finalUrl = page.url();
            const title = await page.title();

            const html = await page.content();

            if (format === "html") {
                return {
                    url: finalUrl,
                    title,
                    format,
                    content: html,
                };
            }

            const turndown = new TurndownService({
                headingStyle: "atx",
                codeBlockStyle: "fenced",
                bulletListMarker: "-",
            });

            turndown.remove([
                "script",
                "style",
                "noscript",
            ]);

            const markdown = turndown.turndown(html);

            return {
                url: finalUrl,
                title,
                format,
                content: markdown,
            };
        } finally {
            await browser.close();
        }
    },
});