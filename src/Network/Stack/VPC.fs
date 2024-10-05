module Stack.VPC

open Constructs
open HashiCorp.Cdktf
open HashiCorp.Cdktf.Providers

type Subnet() =
    member val name: string = "" with get, set
    member val cidr: string = "" with get, set

type VpcConfig() =
    member val region: string = "" with get, set
    member val cidr: string = "" with get, set
    member val azs: string[] = [||] with get, set
    member val subnets: Subnet[] = [||] with get, set

let createTagWithName name = Map [ ("Name", name) ]

type RouteTable(scope: Construct, name: string, config: Aws.RouteTable.RouteTableConfig) =
    member self.instance = Aws.RouteTable.RouteTable(scope, name, config)

    member self.Associate(subnetId: string) =
        let config =
            Aws.RouteTableAssociation.RouteTableAssociationConfig(SubnetId = subnetId, RouteTableId = self.instance.Id)

        Aws.RouteTableAssociation.RouteTableAssociation(scope, $"{name}-default", config)
        |> ignore

type VPCStack(scope: Construct, id: string, config: VpcConfig) as self =
    inherit TerraformStack(scope, id)

    do
        Aws.Provider.AwsProvider(self, id, Aws.Provider.AwsProviderConfig(Region = config.region))
        |> ignore

        let vpc = self.NewVpc $"vpc-main"

        let igw = self.NewInternetGateway($"igw-main", vpc)

        let subnets =
            config.subnets
            |> Seq.map (fun subnet ->
                (subnet.name,
                 config.azs
                 |> Seq.mapi (fun index azId ->
                     self.NewSubnet($"{subnet.name}-{index}", vpc, azId, Fn.Cidrsubnet(subnet.cidr, 2, index)))
                 |> Array.ofSeq))
            |> Map.ofSeq

        let eip = self.NewEip $"eip-nat-main"

        let nat = self.NewNatGateway($"nat-main", eip, subnets.Item("public-main")[0])

        subnets.Item("public-main")
        |> Array.iter (fun subnet -> self.NewPublicRouteTable(subnet, igw))

        subnets.Item("private-main")
        |> Array.iter (fun subnet -> self.NewPrivateRouteTable(subnet, nat))

    member self.NewVpc(name: string) : Aws.Vpc.Vpc =
        let config =
            Aws.Vpc.VpcConfig(CidrBlock = config.cidr, EnableDnsHostnames = true, Tags = createTagWithName name)

        Aws.Vpc.Vpc(self, name, config)

    member self.NewInternetGateway(name: string, vpc: Aws.Vpc.Vpc) : Aws.InternetGateway.InternetGateway =
        let config =
            Aws.InternetGateway.InternetGatewayConfig(VpcId = vpc.Id, Tags = createTagWithName name)

        Aws.InternetGateway.InternetGateway(self, name, config)

    member self.NewSubnet(name: string, vpc: Aws.Vpc.Vpc, azId: string, cidr: string) : Aws.Subnet.Subnet =
        let config =
            Aws.Subnet.SubnetConfig(
                VpcId = vpc.Id,
                CidrBlock = cidr,
                AvailabilityZoneId = azId,
                Tags = createTagWithName name
            )

        Aws.Subnet.Subnet(self, name, config)

    member self.NewPublicRouteTable(subnet: Aws.Subnet.Subnet, gateway: Aws.InternetGateway.InternetGateway) =
        let name = subnet.TagsInput.Item("Name")

        let routes =
            [| Aws.RouteTable.RouteTableRoute(CidrBlock = "0.0.0.0/0", GatewayId = gateway.Id) |]

        let config =
            Aws.RouteTable.RouteTableConfig(VpcId = subnet.VpcId, Route = routes, Tags = createTagWithName name)

        RouteTable(self, $"rt-{name}", config).Associate(subnet.Id)

    member self.NewPrivateRouteTable(subnet: Aws.Subnet.Subnet, nat: Aws.NatGateway.NatGateway) =
        let name = subnet.TagsInput.Item("Name")

        let routes =
            [| Aws.RouteTable.RouteTableRoute(CidrBlock = "0.0.0.0/0", NatGatewayId = nat.Id) |]

        let config =
            Aws.RouteTable.RouteTableConfig(VpcId = subnet.VpcId, Route = routes, Tags = createTagWithName name)

        RouteTable(self, $"rt-{name}", config).Associate(subnet.Id)

    member self.NewEip(name: string) : Aws.Eip.Eip =
        let config = Aws.Eip.EipConfig(Domain = "vpc")

        Aws.Eip.Eip(self, name, config)

    member self.NewNatGateway(name: string, eip: Aws.Eip.Eip, subnet: Aws.Subnet.Subnet) : Aws.NatGateway.NatGateway =
        let config =
            Aws.NatGateway.NatGatewayConfig(AllocationId = eip.Id, SubnetId = subnet.Id, Tags = createTagWithName name)

        Aws.NatGateway.NatGateway(self, name, config)
