import { Lb as AwsLb } from "@cdktf/provider-aws/lib/lb";
import type { LbConfig as AwsLbConfig } from "@cdktf/provider-aws/lib/lb";

import { Resource } from "../resource";

export type NLBConfig = Omit<AwsLbConfig, "loadBalancerType">;

export class NLB extends Resource<AwsLb, NLBConfig> {
  protected _create(): AwsLb {
    return new AwsLb(this._scope, this.uid, {
      ...this._config,
      name: this.name,
      loadBalancerType: "network",
    });
  }
}
