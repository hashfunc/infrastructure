import { Eip as AwsEip } from "@cdktf/provider-aws/lib/eip";

import { Resource } from "../resource";

export class EIP extends Resource<AwsEip, object> {
  protected _create(): AwsEip {
    return new AwsEip(this._scope, this.uid, this._config);
  }
}
