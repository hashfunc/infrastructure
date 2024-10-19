import { Vpc as AwsVpc } from "@cdktf/provider-aws/lib/vpc";

import { Resource } from "../resource";

export interface VPCConfig {
  cidrBlock: string;
}

export class VPC extends Resource<AwsVpc, VPCConfig> {
  protected _create(): AwsVpc {
    return new AwsVpc(this._scope, this.uid, this._config);
  }
}
