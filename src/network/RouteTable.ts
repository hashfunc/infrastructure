import {
  RouteTable as AwsRouteTable,
  type RouteTableRoute as AwsRouteTableRoute,
} from "@cdktf/provider-aws/lib/route-table";

import { Resource } from "../resource";

interface RouteTableConfig {
  vpcId: string;
  route: AwsRouteTableRoute[];
}

export class RouteTable extends Resource<AwsRouteTable, RouteTableConfig> {
  protected _create(): AwsRouteTable {
    return new AwsRouteTable(this._scope, this.uid, this._config);
  }
}
