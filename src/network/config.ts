import type { SubnetConfig } from "./Subnet";
import type { VPCConfig } from "./VPC";

export interface NetworkConfig {
  region: string;
  vpc: {
    [name: string]: VPCConfig & {
      internetGateway: { [name: string]: object };
      subnet: { [name: string]: SubnetConfig[] };
    };
  };
}
