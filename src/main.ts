import { App } from "cdktf";

import { loadConfig } from "./config";
import { NetworkStack } from "./network";

const config = loadConfig();

const app = new App();

Object.entries(config.network).map(
  ([name, config]) => new NetworkStack(app, `network-${name}`, config),
);

app.synth();
