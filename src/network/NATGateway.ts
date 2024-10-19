import { NatGateway as AwsNatGateway } from "@cdktf/provider-aws/lib/nat-gateway";

import { Resource } from "../resource";

interface NATGatewayConfig {
  allocationId: string;
  subnetId: string;
}

export class NATGateway extends Resource<AwsNatGateway, NATGatewayConfig> {
  protected _create(): AwsNatGateway {
    return new AwsNatGateway(this._scope, this.uid, this._config);
  }
}
