import fs from "fs";
import path from "path";
import z from "zod";

const SkillMetaSchema = z.object({
    description: z.string().min(1),
    access: z.enum(["public", "private"]),
});

export type SkillInfo = z.infer<typeof SkillMetaSchema> & { name: string }

export function getSkillsRegistry(baseDir: string): SkillInfo[] {
    return fs
        .readdirSync(baseDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => {
            const name = entry.name;
            const metaPath = path.join(baseDir, name, "skill.meta.json");

            if (!fs.existsSync(metaPath)) {
                throw new Error(`Missing skill.meta.json for skill "${name}"`);
            }

            const meta = SkillMetaSchema.parse(
                JSON.parse(fs.readFileSync(metaPath, "utf8")),
            );

            return {
                name,
                description: meta.description,
                access: meta.access,
            };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
}