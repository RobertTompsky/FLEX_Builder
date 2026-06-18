<script lang="ts">
    import { deleteFiles, uploadFiles } from "../../api/callAgent";
    import { infoState, agentState } from "../../store/index.svelte";
    import "./styles.css";

    let fileInput = $state<HTMLInputElement | null>(null);
    let files = $state<File[]>([]);
    let uploading = $state(false);

    const selectedCount = $derived(agentState.files?.size);
    const pendingFilesCount = $derived(files.length);

    function toggleFile(file: string) {
        const next = new Set(agentState.files);

        if (next.has(file)) {
            next.delete(file);
        } else {
            next.add(file);
        }

        agentState.files = next;
    }

    async function deleteSelected() {
        const result = await deleteFiles([...agentState.files]);

        infoState.uploads = infoState.uploads.filter(
            (file) => !result.deleted.includes(file),
        );

        agentState.files = new Set();
    }

    async function uploadSelectedFiles() {
        if (!files.length || uploading) return;

        uploading = true;

        try {
            const uploadResult = await uploadFiles(files);

            const uploadedNames = uploadResult.map((ev) => ev.filename);

            infoState.uploads = Array.from(
                new Set([...infoState.uploads, ...uploadedNames]),
            );

            files = [];

            if (fileInput) {
                fileInput.value = "";
            }
        } catch (error) {
            console.error("upload error:", error);
        } finally {
            uploading = false;
        }
    }
</script>

<div class="files-desktop">
    <div class="files-desktop-title">
        <span class="files-title-icon">■</span>

        <span class="files-title-text">UPLOADED FILES</span>

        <span class="files-title-count">
            [{String(infoState.uploads.length).padStart(2, "0")}]
        </span>

        <input
            bind:this={fileInput}
            class="file-input"
            type="file"
            multiple
            accept=".txt,.md,.json,.csv,.xml,.js,.ts"
            onchange={(e) => {
                const input = e.currentTarget as HTMLInputElement;
                files = Array.from(input.files ?? []);
            }}
        />

        <button
            class="upload-file"
            type="button"
            title="Выбрать файл"
            aria-label="Выбрать файл"
            onclick={() => fileInput?.click()}
            disabled={uploading}
        >
            <span class="upload-file-icon" aria-hidden="true">↑</span>
            <span>SELECT</span>
        </button>

        {#if pendingFilesCount > 0}
            <button
                class="upload-file"
                type="button"
                onclick={uploadSelectedFiles}
                disabled={uploading}
            >
                {uploading ? "UPLOADING..." : `SAVE ${pendingFilesCount}`}
            </button>

            <button
                class="upload-clear"
                type="button"
                onclick={() => {
                    files = [];

                    if (fileInput) {
                        fileInput.value = "";
                    }
                }}
                title="Отменить выбор файлов"
            >
                ×
            </button>
        {/if}

        <!-- <button
            class="upload-file"
            type="button"
            title="Загрузить файл"
            aria-label="Загрузить файл"
        >
            <span class="upload-file-icon" aria-hidden="true">↑</span>
            <span>UPLOAD</span>
        </button> -->
    </div>

    <div class="files">
        {#each infoState.uploads as file, index}
            <div class="file-tile">
                <input
                    class="file-checkbox"
                    id={`file-${index}`}
                    type="checkbox"
                    name="selected-files"
                    value={file}
                    checked={agentState.files.has(file)}
                    onchange={() => toggleFile(file)}
                />

                <label class="file-select-area" for={`file-${index}`}>
                    <span class="file-index">
                        {String(index + 1).padStart(2, "0")}
                    </span>

                    <span class="desktop-file-icon" aria-hidden="true">
                        <span class="icon-fold"></span>

                        <span class="icon-lines">
                            <span></span>
                            <span></span>
                            <span></span>
                        </span>

                        <span class="file-extension">
                            {file.split(".").at(-1)?.slice(0, 3).toUpperCase()}
                        </span>
                    </span>

                    <span class="desktop-file-name">
                        {file}
                    </span>
                </label>
            </div>
        {/each}
    </div>

    {#if selectedCount > 0}
        <div class="files-actions">
            <button
                class="files-action"
                type="button"
                onclick={() => (agentState.files = new Set())}
            >
                CANCEL ({selectedCount})
            </button>

            <button
                class="files-action files-action-danger"
                type="button"
                onclick={deleteSelected}
            >
                DELETE ({selectedCount})
            </button>
        </div>
    {/if}
</div>
