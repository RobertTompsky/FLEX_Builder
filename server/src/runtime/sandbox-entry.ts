import "./globals";

const userFile = process.argv.at(2);

if (!userFile) {
  throw new Error("Sandbox user file path is missing");
}

await import(userFile);