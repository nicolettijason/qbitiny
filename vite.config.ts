import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// flag-icons ships a square (.fis) variant of every country flag alongside
// the default rectangular one. The app only ever uses the rectangular
// variant, but Vite still bundles every SVG referenced via url() in the
// imported CSS - stripping the unused rules here halves the flag SVGs
// (~1080 -> ~540 files) that end up in the build output.
function stripUnusedFlagVariant(): Plugin {
	return {
		name: "strip-unused-flag-variant",
		enforce: "pre",
		transform(code, id) {
			if (!id.includes("flag-icons") || !id.endsWith(".css")) return null;
			return code.replace(/\.fi-[a-z0-9-]+\.fis\{background-image:url\([^)]*\)\}/g, "");
		},
	};
}

export default defineConfig({
	plugins: [stripUnusedFlagVariant(), react(), tailwindcss()],
	build: {
		outDir: "release/qbitiny/public",
	},
	base: "./",
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		proxy: {
			"/api": {
				target: "http://192.168.0.196:30024",
				changeOrigin: true,
			},
		},
	},
});
