module Stack

open Constructs
open HashiCorp.Cdktf
open HashiCorp.Cdktf.Providers.Aws.Eip
open HashiCorp.Cdktf.Providers.Aws.InternetGateway
open HashiCorp.Cdktf.Providers.Aws.NatGateway
open HashiCorp.Cdktf.Providers.Aws.Provider
open HashiCorp.Cdktf.Providers.Aws.RouteTable
open HashiCorp.Cdktf.Providers.Aws.Subnet
open HashiCorp.Cdktf.Providers.Aws.Vpc

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


type VPCStack(scope: Construct, id: string) as self =
    inherit TerraformStack(scope, id)

    do
        AwsProvider(self, id, AwsProviderConfig(Region = DEFAULT_AWS_REGION)) |> ignore

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
        |> Array.iter (fun subnet -> self.NewPublicRouteTable(subnet, igw) |> ignore)

        subnets.Item("private-main")
        |> Array.iter (fun subnet -> self.NewPrivateRouteTable(subnet, nat) |> ignore)

    member self.NewVpc(name: string) : Vpc =
        let config =
            VpcConfig(CidrBlock = DEFAULT_VPC_CIDR, EnableDnsHostnames = true, Tags = createTagWithName name)

        Vpc(self, name, config)

    member self.NewInternetGateway(name: string, vpc: Vpc) : InternetGateway =
        let config = InternetGatewayConfig(VpcId = vpc.Id, Tags = createTagWithName name)

        InternetGateway(self, name, config)

    member self.NewSubnet(name: string, vpc: Vpc, azId: string, cidr: string) : Subnet =
        let config =
            SubnetConfig(VpcId = vpc.Id, CidrBlock = cidr, AvailabilityZoneId = azId, Tags = createTagWithName name)

        Subnet(self, name, config)

    member self.NewPublicRouteTable(subnet: Subnet, gateway: InternetGateway) : RouteTable =
        let name = subnet.TagsInput.Item("Name")

        let routes = [| RouteTableRoute(CidrBlock = "0.0.0.0/0", GatewayId = gateway.Id) |]

        let config =
            RouteTableConfig(VpcId = subnet.VpcId, Route = routes, Tags = createTagWithName (name))

        RouteTable(self, $"rt-{name}", config)

    member self.NewPrivateRouteTable(subnet: Subnet, nat: NatGateway) : RouteTable =
        let name = subnet.TagsInput.Item("Name")

        let routes = [| RouteTableRoute(CidrBlock = "0.0.0.0/0", NatGatewayId = nat.Id) |]

        let config =
            RouteTableConfig(VpcId = subnet.VpcId, Route = routes, Tags = createTagWithName name)

        RouteTable(self, $"rt-{name}", config)

    member self.NewEip(name: string) : Eip =
        let config = EipConfig(Domain = "vpc")

        Eip(self, name, config)

    member self.NewNatGateway(name: string, eip: Eip, subnet: Subnet) : NatGateway =
        let config =
            NatGatewayConfig(AllocationId = eip.Id, SubnetId = subnet.Id, Tags = createTagWithName name)

        NatGateway(self, name, config)
