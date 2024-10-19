import { TerraformStack } from "cdktf";
import type { Construct } from "constructs";
import { keyBy, merge } from "es-toolkit";

import { AwsProvider } from "@cdktf/provider-aws/lib/provider";

import type { NetworkConfig } from "./config";
import { InternetGateway } from "./InternetGateway";
import { Subnet, type SubnetConfig } from "./Subnet";
import { VPC } from "./VPC";

export class NetworkStack extends TerraformStack {
  private _resources: {
    vpc: { [name: string]: VPC };
    internetGateway: { [name: string]: InternetGateway };
    subnet: { [name: string]: Subnet };
  } = { vpc: {}, internetGateway: {}, subnet: {} };

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
    merge(
      this._resources.vpc,
      keyBy(
        Object.entries(this._config.vpc).map(([name, config]) => {
          const vpc = new VPC(this, name, config);

          this._createInternetGateway(vpc.id, config.internetGateway);
          this._createSubnet(vpc.id, config.subnet);

          return vpc;
        }),
        (vpc) => vpc.name,
      ),
    );
  }

  private _createSubnet(
    vpcId: string,
    subets: { [name: string]: SubnetConfig[] },
  ) {
    merge(
      this._resources.subnet,
      keyBy(
        Object.entries(subets).flatMap(([name, subnet]) =>
          subnet.map(
            (config) =>
              new Subnet(this, `${name}-${config.availabilityZoneId}`, {
                ...config,
                vpcId,
              }),
          ),
        ),
        (subnet) => subnet.name,
      ),
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
