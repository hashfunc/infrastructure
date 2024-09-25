open HashiCorp.Cdktf

open Stack

[<EntryPoint>]
let main _ =
    let app = App()

    VPCStack(app, "hashfunc-vpc") |> ignore

    app.Synth()
    0
