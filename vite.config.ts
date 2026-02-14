import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { componentTagger } from "lovable-tagger";

function getGitInfo() {
  try {
    const commitHash = execSync("git rev-parse --short HEAD").toString().trim();
    const commitCount = execSync("git rev-list --count HEAD").toString().trim();
    return { commitHash, commitCount };
  } catch {
    return { commitHash: "unknown", commitCount: "0" };
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const { commitHash, commitCount } = getGitInfo();
  const pkg = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "package.json"), "utf-8")
  );

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __BUILD_NUMBER__: JSON.stringify(commitCount),
      __BUILD_HASH__: JSON.stringify(commitHash),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
