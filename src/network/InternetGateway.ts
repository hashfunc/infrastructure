import { InternetGateway as AwsInternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";

import { Resource, type ResourceConfig } from "../resource";

interface InternetGatewayConfig extends ResourceConfig {
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