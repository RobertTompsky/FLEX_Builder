import { API_URL } from "./shared";

async function uploadFiles(files: File[]) {
    const formData = new FormData()

    for (const file of files) {
        formData.append("files", file)
    }

    const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
    });

    return await res.json() as {
        filename: string,
        type: string,
        path: string
    }[]
}

async function deleteFiles(files: string[]) {
    const res = await fetch(`${API_URL}/deleteFiles`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            files,
        }),
    });

    if (!res.ok) {
        throw new Error(await res.text());
    }

    return (await res.json()) as {
        ok: boolean;
        deleted: string[];
        failed: string[];
    };
}

export const uploadsApi = {
    upload: uploadFiles,
    delete: deleteFiles
}

