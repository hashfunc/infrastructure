import { InternetGateway as AwsInternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";

import { Resource } from "../resource";

export interface InternetGatewayConfig {
  vpcId: string;
}

export class InternetGateway extends Resource<
  AwsInternetGateway,
  InternetGatewayConfig
> {
  protected _create(): AwsInternetGateway {
    return new AwsInternetGateway(this._scope, this.uid, this._config);
  }
}
