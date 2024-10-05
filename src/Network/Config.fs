module Infrastructure.Network.Config

open System.IO

open YamlDotNet.Serialization
open YamlDotNet.Serialization.NamingConventions

open Stack.VPC

type NetworkConfig() =
    member val vpc = VpcConfig() with get, set

let LoadConfig _ =
    let config = File.ReadAllText "./config.yaml"

    let deserializer =
        DeserializerBuilder()
            .WithNamingConvention(UnderscoredNamingConvention.Instance)
            .Build()

    deserializer.Deserialize<NetworkConfig>(config)
