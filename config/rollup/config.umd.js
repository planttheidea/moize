import baseConfig, { ROOT } from "./config.base.js";
import pkg from "./packageJson.js";
import typescript from "@rollup/plugin-typescript";
import path from "node:path";
import tsc from "typescript";

export default {
  ...baseConfig,
  output: {
    ...baseConfig.output,
    file: pkg.browser,
    format: "umd",
  },
  plugins: [
    ...baseConfig.plugins,
    typescript({
      tsconfig: path.resolve(ROOT, "tsconfig", "umd.json"),
      typescript: tsc,
    }),
  ],
};
