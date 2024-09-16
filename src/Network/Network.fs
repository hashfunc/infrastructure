open HashiCorp.Cdktf

[<EntryPoint>]
let main argv =
    let app = App()
    app.Synth()
    0
