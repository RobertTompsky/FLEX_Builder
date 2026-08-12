const ENV_WHITELIST = [
    "PATH",
    "PATHEXT",
    "SYSTEMROOT",
    "TEMP",
    "TMP",
    "HOMEDRIVE",
    "HOMEPATH",
    "USERPROFILE",
    "APPDATA",
    "LOCALAPPDATA",
    "COMSPEC",
    "TAVILY_API_KEY",
    "OPENAI_API_KEY",
] as const;

export function createSandboxEnv():
    Record<string, string> {
    const env:
        Record<string, string> = {};

    for (
        const key
        of ENV_WHITELIST
    ) {
        const value =
            process.env[key];

        if (value) {
            env[key] =
                value;
        }
    }

    return env;
}