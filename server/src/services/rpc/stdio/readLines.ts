export async function* readLines(
    stream: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
    const decoder = new TextDecoder();

    let buffer = "";

    for await (const chunk of stream) {
        buffer += decoder.decode(
            chunk,
            {
                stream: true,
            },
        );

        while (true) {
            const index = buffer.indexOf("\n");

            if (index === -1) break;

            const line = buffer
                .slice(0, index)
                .trim();

            buffer = buffer.slice(index + 1);

            if (line) yield line;
        }
    }

    buffer += decoder.decode();

    const line = buffer.trim();

    if (line) yield line;
}