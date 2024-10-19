import { App } from "cdktf";

import { NetworkStack } from "./network";

const SIGNATURE = process.env.SIGNATURE || "hashfunc";
const REGION = process.env.REGION || "ap-northeast-2";

const app = new App();
new NetworkStack(app, `${SIGNATURE}-network`, { region: REGION });
app.synth();
