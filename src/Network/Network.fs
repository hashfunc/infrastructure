open HashiCorp.Cdktf

open Stack

[<EntryPoint>]
let main argv =
    let app = App()

    Stack.VPCStack(app, "hashfunc-vpc", "hashfunc") |> ignore

    app.Synth()
    0
