export function cx(
    ...classes:
        Array<
            string
            | false
            | null
            | undefined
        >
): string {
    return classes
        .filter(Boolean)
        .join(" ");
}

export function toggleSetValue<T>(
    set: Set<T>,
    value: T,
): Set<T> {
    const next = new Set(set);

    if (next.has(value)) {
        next.delete(value);
    } else {
        next.add(value);
    }

    return next;
}