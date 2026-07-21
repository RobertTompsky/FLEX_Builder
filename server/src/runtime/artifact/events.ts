export type ArtifactRuntimeEvent =
    | {
        event: "artifact_read";
        data: {
            filePath: string;
            report: string;
        };
    }
    | {
        event: "artifact_created";
        data: {
            filePath: string;
            report: string;
            description?: string;
        };
    };