import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { repositoryMiddleware } from "./server/repositoryFiles";
const standalone = existsSync(
  fileURLToPath(new URL("./game-resources/", import.meta.url)),
);
function repositoryFiles(): Plugin {
  return {
    name: "snabbit-repository-files",
    configureServer(server) {
      server.middlewares.use(
        "/api/story",
        repositoryMiddleware(
          fileURLToPath(
            new URL(
              standalone
                ? "./game-resources/Levels/data/storyData.txt"
                : "../Resources/Levels/data/storyData.txt",
              import.meta.url,
            ),
          ),
          fileURLToPath(
            new URL(
              standalone ? "./.editor-backups/" : "../.editor-backups/",
              import.meta.url,
            ),
          ),
        ),
      );
    },
  };
}
export default defineConfig({
  plugins: [react(), repositoryFiles()],
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
});
