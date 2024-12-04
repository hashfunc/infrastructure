import { TerraformStack } from "cdktf";
import type { Construct } from "constructs";
import { keyBy, merge } from "es-toolkit";
import { match } from "ts-pattern";

import { AwsProvider } from "@cdktf/provider-aws/lib/provider";

import type { Resource } from "../resource";

import type { NetworkConfig } from "./NetworkConfig";
import { EIP } from "./EIP";
import { InternetGateway } from "./InternetGateway";
import { NATGateway } from "./NATGateway";
import { NLB, type NLBConfig } from "./NLB";
import { RouteTable } from "./RouteTable";
import { RouteTableAssociation } from "./RouteTableAssociation";
import { Subnet, type SubnetConfig } from "./Subnet";
import { VPC } from "./VPC";

type NetworkResource =
  | "eip"
  | "internetGateway"
  | "natGateway"
  | "routeTable"
  | "subnet"
  | "vpc";

export class NetworkStack extends TerraformStack {
  private readonly _resources: Record<
    NetworkResource,
    Record<string, Resource>
  > = {
    eip: {},
    internetGateway: {},
    natGateway: {},
    routeTable: {},
    subnet: {},
    vpc: {},
  };

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
          this._createRouteTable(vpc.id, config.routeTable);

          if (config.nlb) {
            this._createNLB(config.nlb);
          }

          return vpc;
        }),
        (vpc) => vpc.name,
      ),
    );
  }

  private _createSubnet(
    vpcId: string,
    subets: Record<string, Array<SubnetConfig>>,
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

  private _createRouteTable(
    vpcId: string,
    configs: Record<
      string,
      {
        subnet: Array<string>;
        route: Array<{
          type: "NAT" | "Internet";
          cidr: string;
          target: string;
        }>;
      }
    >,
  ) {
    const routeTables = Object.entries(configs).map(([name, config]) => {
      const route = config.route.map((config) =>
        match(config)
          .with({ type: "NAT" }, (config) => ({
            cidrBlock: config.cidr,
            natGatewayId: this._resources.natGateway[config.target].id,
          }))
          .with({ type: "Internet" }, (config) => ({
            cidrBlock: config.cidr,
            gatewayId: this._resources.internetGateway[config.target].id,
          }))
          .exhaustive(),
      );

      const routeTable = new RouteTable(this, name, {
        vpcId,
        route,
      });

      config.subnet.forEach((subnet) => {
        new RouteTableAssociation(this, `${name}-${subnet}`, {
          routeTableId: routeTable.id,
          subnetId: this._resources.subnet[subnet].id,
        });
      });

      return routeTable;
    });

    merge(
      this._resources.routeTable,
      keyBy(routeTables, (routeTable) => routeTable.name),
    );
  }

  private _createInternetGateway(
    vpcId: string,
    config: Record<string, object>,
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

  private _createNatGateway(
    natGateways: Record<string, Array<{ subnet: string; eip: string }>>,
  ) {
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

  private _createNLB(nlb: Record<string, NLBConfig>) {
    Object.entries(nlb).map(([name, config]) => {
      const subnets = config.subnets?.map(
        (subnet) => this._resources.subnet[subnet].id,
      );

      new NLB(this, name, { ...config, subnets });
    });
  }
}
