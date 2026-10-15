import { z } from "zod";
import TurndownService from "turndown";
import {
    action,
} from "../../../services/capabilities";


const BrowserOpenInputSchema = z.object({
    url: z
        .url(),

    format: z
        .enum([
            "markdown",
            "html",
        ])
        .default(
            "markdown",
        ),

    timeout: z
        .number()
        .int()
        .positive()
        .max(
            60_000,
        )
        .default(
            30_000,
        ),
});

const BrowserOpenOutputSchema = z.object({
    url: z.string(),

    title: z.string(),

    format: z.enum([
        "markdown",
        "html",
    ]),

    content: z.string(),
});

export const openPageAction = action({
    description:
        "Open a web page in a browser and return its rendered content as Markdown or HTML.",

    inputSchema:
        BrowserOpenInputSchema,

    outputSchema:
        BrowserOpenOutputSchema,

    async execute({
        args,
    }) {
        const {
            url,
            timeout,
            format,
        } = args;

        const view =
            new Bun.WebView({
                headless: true,

                backend:
                    "chrome",
            });

        try {
            await Promise.race([
                view.navigate(
                    url,
                ),

                Bun.sleep(
                    timeout,
                ).then(
                    () => {
                        throw new Error(
                            `Navigation timed out after ${timeout}ms`,
                        );
                    },
                ),
            ]);

            const {
                finalUrl,
                title,
                html,
            } = await view.evaluate<{
                finalUrl: string;
                title: string;
                html: string;
            }>(`
                ({
                    finalUrl: location.href,
                    title: document.title,
                    html: document.documentElement.outerHTML,
                })
            `);

            if (
                format === "html"
            ) {
                return {
                    url:
                        finalUrl,

                    title,

                    format,

                    content:
                        html,
                };
            }

            const turndown =
                new TurndownService({
                    headingStyle:
                        "atx",

                    codeBlockStyle:
                        "fenced",

                    bulletListMarker:
                        "-",
                });

            turndown.remove([
                "script",
                "style",
                "noscript",
            ]);

            return {
                url:
                    finalUrl,

                title,

                format,

                content:
                    turndown.turndown(
                        html,
                    ),
            };
        } finally {
            view.close();
        }
    },
});