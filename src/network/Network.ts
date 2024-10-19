import { TerraformStack } from "cdktf";
import type { Construct } from "constructs";
import { keyBy, merge } from "es-toolkit";

import { AwsProvider } from "@cdktf/provider-aws/lib/provider";

import type { NetworkConfig } from "./config";
import { EIP } from "./EIP";
import { InternetGateway } from "./InternetGateway";
import { NATGateway } from "./NATGateway";
import { Subnet, type SubnetConfig } from "./Subnet";
import { VPC } from "./VPC";

export class NetworkStack extends TerraformStack {
  private _resources: {
    vpc: { [name: string]: VPC };
    internetGateway: { [name: string]: InternetGateway };
    subnet: { [name: string]: Subnet };
    eip: { [name: string]: EIP };
    natGateway: { [name: string]: NATGateway };
  } = { vpc: {}, internetGateway: {}, subnet: {}, eip: {}, natGateway: {} };

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
    this._createEIP();
    this._createVPC();
  }

  private _createEIP() {
    merge(
      this._resources.eip,
      keyBy(
        Object.keys(this._config.eip).map((name) => new EIP(this, name, {})),
        (eip) => eip.name,
      ),
    );
  }

  private _createVPC() {
    merge(
      this._resources.vpc,
      keyBy(
        Object.entries(this._config.vpc).map(([name, config]) => {
          const vpc = new VPC(this, name, config);

          this._createSubnet(vpc.id, config.subnet);
          this._createInternetGateway(vpc.id, config.internetGateway);
          this._createNatGateway(config.natGateway);

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

  private _createNatGateway(natGateways: {
    [name: string]: Array<{ subnet: string; eip: string }>;
  }) {
    merge(
      this._resources.natGateway,
      keyBy(
        Object.entries(natGateways).flatMap(([name, natGateway]) =>
          natGateway.map(
            (config) =>
              new NATGateway(this, name, {
                allocationId: this._resources.eip[config.eip].id,
                subnetId: this._resources.subnet[config.subnet].id,
              }),
          ),
        ),
        (natGateway) => natGateway.name,
      ),
    );
  }
}
