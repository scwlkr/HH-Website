import { registerHooks } from "node:module";
import { load } from "./css-module-loader.mjs";

registerHooks({ load });
