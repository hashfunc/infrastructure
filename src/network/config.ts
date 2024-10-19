import type { SubnetConfig } from "./Subnet";
import type { VPCConfig } from "./VPC";

export interface NetworkConfig {
  region: string;
  eip: Record<string, object>;
  vpc: Record<
    string,
    VPCConfig & {
      internetGateway: Record<string, object>;
      natGateway: Record<string, Array<{ subnet: string; eip: string }>>;
      subnet: Record<string, Array<SubnetConfig>>;
      routeTable: Record<
        string,
        {
          subnet: Array<string>;
          route: Array<{
            type: "NAT" | "Internet";
            cidr: string;
            target: string;
          }>;
        }
      >;
    }
  >;
}
