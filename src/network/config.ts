import type { VPCConfig } from "./VPC";

export interface NetworkConfig {
  region: string;
  vpc: { [name: string]: VPCConfig };
}
