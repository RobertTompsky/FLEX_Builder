import path from 'path'

export function resolveArtifactPath(
    baseDir: string,
    filePath: string,
): string {
    const resolvedPath =
        path.resolve(
            baseDir,
            filePath,
        );

    const relativePath =
        path.relative(
            baseDir,
            resolvedPath,
        );

    if (
        relativePath === "" ||
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error(
            `Artifact path is outside the workspace: ${filePath}`,
        );
    }

    return resolvedPath;
}