import { nodeResolve } from "@rollup/plugin-node-resolve";
import { fileURLToPath } from "url";
import pkg from "./packageJson.js";

export const ROOT = fileURLToPath(new URL("..", import.meta.url));

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];
const globals = external.reduce((globals, name) => {
  globals[name] = name;

  return globals;
}, {});

export default {
  external,
  input: "src/index.ts",
  output: {
    exports: "named",
    globals,
    name: pkg.name,
    sourcemap: true,
  },
  plugins: [
    nodeResolve({
      mainFields: ["module", "browser", "main"],
    }),
  ],
};
