import { TerraformStack } from "cdktf";
import type { Construct } from "constructs";

import { AwsProvider } from "@cdktf/provider-aws/lib/provider";

import type { NetworkConfig } from "./config";

export class NetworkStack extends TerraformStack {
  constructor(
    scope: Construct,
    private _id: string,
    private _config: NetworkConfig,
  ) {
    super(scope, _id);

    this._init();
  }

  private _init() {
    new AwsProvider(this, this._id, { region: this._config.region });
  }
}
