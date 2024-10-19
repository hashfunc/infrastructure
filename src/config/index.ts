import { readFileSync } from "node:fs";
import { parse } from "yaml";

import type { NetworkConfig } from "../network/NetworkConfig";

interface Conifg {
  network: { [name: string]: NetworkConfig };
}

export function loadConfig(): Conifg {
  const config = readFileSync("config.yaml", "utf8");
  return parse(config);
}
