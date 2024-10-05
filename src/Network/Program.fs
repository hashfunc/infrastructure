module Infrastructure.Network.Program

open HashiCorp.Cdktf

open Config
open Stack.VPC

[<EntryPoint>]
let main _ =
    let config = LoadConfig()
    
    let app = App()
    
    VPCStack(app, "hashfunc-vpc", config.vpc) |> ignore

    app.Synth()
    0
