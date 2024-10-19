import { TerraformStack } from "cdktf";
import type { Construct } from "constructs";

import { AwsProvider } from "@cdktf/provider-aws/lib/provider";

import type { NetworkConfig } from "./config";
import { VPC } from "./VPC";
import { keyBy } from "es-toolkit";

export class NetworkStack extends TerraformStack {
  private resources: {
    vpc: { [name: string]: VPC };
  } = { vpc: {} };

  constructor(
    scope: Construct,
    private _id: string,
    private _config: NetworkConfig,
  ) {
    super(scope, _id);

    this._init();
    this._create();
  }

  private _init() {
    new AwsProvider(this, this._id, { region: this._config.region });
  }

  private _create() {
    this._createVPC();
  }

  private _createVPC() {
    this.resources.vpc = keyBy(
      Object.entries(this._config.vpc).map(
        ([name, config]) => new VPC(this, name, config),
      ),
      (vpc) => vpc.name,
    );
  }
}
