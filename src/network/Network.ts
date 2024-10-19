import { TerraformStack } from "cdktf";
import type { Construct } from "constructs";
import { keyBy, merge } from "es-toolkit";

import { AwsProvider } from "@cdktf/provider-aws/lib/provider";

import type { NetworkConfig } from "./config";
import { InternetGateway } from "./InternetGateway";
import { VPC } from "./VPC";

export class NetworkStack extends TerraformStack {
  private _resources: {
    vpc: { [name: string]: VPC };
    internetGateway: { [name: string]: InternetGateway };
  } = { vpc: {}, internetGateway: {} };

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
    this._resources.vpc = keyBy(
      Object.entries(this._config.vpc).map(([name, config]) => {
        const vpc = new VPC(this, name, config);

        this._createInternetGateway(vpc.id, config.internetGateway);

        return vpc;
      }),
      (vpc) => vpc.name,
    );
  }

  private _createInternetGateway(
    vpcId: string,
    config: { [name: string]: object },
  ) {
    merge(
      this._resources.internetGateway,
      keyBy(
        Object.keys(config).map(
          (name) => new InternetGateway(this, name, { vpcId }),
        ),
        (internetGateway) => internetGateway.name,
      ),
    );
  }
}
