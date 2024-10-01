module Stack

open Constructs
open HashiCorp.Cdktf
open HashiCorp.Cdktf.Providers

[<Literal>]
let DEFAULT_AWS_REGION = "ap-northeast-2"

[<Literal>]
let DEFAULT_VPC_CIDR = "10.192.0.0/16"

let DEFAULT_SUBNET_LIST =
    [| {| Name = "private-main"
          Cidr = "10.192.192.0/22" |}
       {| Name = "public-main"
          Cidr = "10.192.0.0/22" |} |]

let DEFAULT_AZ_ID_LIST = [| "apne2-az1"; "apne2-az3" |]

let createTagWithName name = Map [ ("Name", name) ]

type RouteTable(scope: Construct, name: string, config: Aws.RouteTable.RouteTableConfig) =
    member self.instance = Aws.RouteTable.RouteTable(scope, name, config)

    member self.Associcate(subnetId: string) =
        let config =
            Aws.RouteTableAssociation.RouteTableAssociationConfig(SubnetId = subnetId, RouteTableId = self.instance.Id)

        Aws.RouteTableAssociation.RouteTableAssociation(scope, $"{name}-default", config)
        |> ignore

type VPCStack(scope: Construct, id: string) as self =
    inherit TerraformStack(scope, id)

    do
        Aws.Provider.AwsProvider(self, id, Aws.Provider.AwsProviderConfig(Region = DEFAULT_AWS_REGION))
        |> ignore

        let vpc = self.NewVpc $"vpc-main"

        let igw = self.NewInternetGateway($"igw-main", vpc)

        let subnets =
            DEFAULT_SUBNET_LIST
            |> Seq.map (fun subnet ->
                (subnet.Name,
                 DEFAULT_AZ_ID_LIST
                 |> Seq.mapi (fun index azId ->
                     self.NewSubnet($"{subnet.Name}-{index}", vpc, azId, Fn.Cidrsubnet(subnet.Cidr, 2, index)))
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
            Aws.Vpc.VpcConfig(CidrBlock = DEFAULT_VPC_CIDR, EnableDnsHostnames = true, Tags = createTagWithName name)

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
            Aws.RouteTable.RouteTableConfig(VpcId = subnet.VpcId, Route = routes, Tags = createTagWithName (name))

        RouteTable(self, $"rt-{name}", config).Associcate(subnet.Id)

    member self.NewPrivateRouteTable(subnet: Aws.Subnet.Subnet, nat: Aws.NatGateway.NatGateway) =
        let name = subnet.TagsInput.Item("Name")

        let routes =
            [| Aws.RouteTable.RouteTableRoute(CidrBlock = "0.0.0.0/0", NatGatewayId = nat.Id) |]

        let config =
            Aws.RouteTable.RouteTableConfig(VpcId = subnet.VpcId, Route = routes, Tags = createTagWithName name)

        RouteTable(self, $"rt-{name}", config).Associcate(subnet.Id)

    member self.NewEip(name: string) : Aws.Eip.Eip =
        let config = Aws.Eip.EipConfig(Domain = "vpc")

        Aws.Eip.Eip(self, name, config)

    member self.NewNatGateway(name: string, eip: Aws.Eip.Eip, subnet: Aws.Subnet.Subnet) : Aws.NatGateway.NatGateway =
        let config =
            Aws.NatGateway.NatGatewayConfig(AllocationId = eip.Id, SubnetId = subnet.Id, Tags = createTagWithName name)

        Aws.NatGateway.NatGateway(self, name, config)
