import { Subnet as AwsSubnet } from "@cdktf/provider-aws/lib/subnet";

import { Resource } from "../resource";

export interface SubnetConfig {
  name: string;
  vpcId: string;
  cidrBlock: string;
  availabilityZoneId: string;
}

export class Subnet extends Resource<AwsSubnet, SubnetConfig> {
  protected _create() {
    return new AwsSubnet(this._scope, this.uid, this._config);
  }
}
