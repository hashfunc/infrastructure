import { RouteTableAssociation as AwsRouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";

import { Resource } from "../resource";

interface RouteTableAssociationConfig {
  routeTableId: string;
  subnetId: string;
}

export class RouteTableAssociation extends Resource<
  AwsRouteTableAssociation,
  RouteTableAssociationConfig
> {
  protected _create(): AwsRouteTableAssociation {
    return new AwsRouteTableAssociation(this._scope, this.uid, this._config);
  }
}
