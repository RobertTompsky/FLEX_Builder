import { z } from 'zod'
import { action } from '../../../runtime/execute';
import path from 'path'
import {
    extractText,
    getDocumentProxy,
} from "unpdf";

const WebDownloadInputSchema =
    z.object({
        url: z
            .url()
    });

const WebDownloadOutputSchema = z.object({
    url: z.string(),
    filename: z.string(),
    format: z.enum([
        "text",
        "markdown",
    ]),
    content: z.string(),
});

export const downloadAction = action({
    description: "Download a supported document from a URL and return its extracted text content.",
    inputSchema: WebDownloadInputSchema,
    outputSchema: WebDownloadOutputSchema,
    async handler({
        url,
    }) {
        const resolvedUrl = resolveDownloadUrl(url);

        const response = await fetch(resolvedUrl);

        if (!response.ok) {
            throw new Error(
                `Failed to download ${url}: ${response.status} ${response.statusText}`,
            );
        }

        const buffer = new Uint8Array(
            await response.arrayBuffer(),
        );

        const signature = new TextDecoder().decode(
            buffer.slice(0, 5),
        );

        if (signature !== "%PDF-") {
            const contentType =
                response.headers.get(
                    "content-type",
                );

            throw new Error(
                `Expected PDF, received ${contentType ?? "unknown content type"}`,
            );
        }

        const pdf = await getDocumentProxy(buffer);

        const { text } = await extractText(
            pdf,
            {
                mergePages: true,
            },
        );

        return {
            url: response.url || url,
            filename:
                getFilename(
                    response,
                    resolvedUrl,
                ),
            content: text.slice(0, 5000),
            format: 'text' as const
        };
    }
});


function resolveDownloadUrl(
    url: string,
): string {
    const parsed =
        new URL(url);

    if (
        parsed.hostname !==
        "github.com"
    ) {
        return url;
    }

    const match =
        parsed.pathname.match(
            /^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/,
        );

    if (!match) {
        return url;
    }

    const [
        ,
        owner,
        repo,
        ref,
        filePath,
    ] = match;

    return (
        `https://raw.githubusercontent.com/` +
        `${owner}/${repo}/${ref}/${filePath}`
    );
}

function getFilename(
    response: Response,
    url: string,
): string {
    const disposition =
        response.headers.get(
            "content-disposition",
        );

    const match =
        disposition?.match(
            /filename="?([^"]+)"?/i,
        );

    if (match?.[1]) {
        return path.basename(
            match[1],
        );
    }

    const pathname =
        new URL(url).pathname;

    const filename =
        path.basename(pathname);

    return filename || "download";
}

const ALLOWED_EXTENSIONS =
    new Set([
        ".pdf",
        ".doc",
        ".docx",
        ".txt",
        ".md",
        ".rtf",
        ".csv",
        ".xls",
        ".xlsx",
    ]);

const ALLOWED_CONTENT_TYPES =
    new Set([
        "application/pdf",

        "application/msword",

        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

        "text/plain",
        "text/markdown",
        "text/csv",

        "application/vnd.ms-excel",

        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]);