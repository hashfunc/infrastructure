import { App, TerraformStack } from "cdktf";

class MyStack extends TerraformStack {}

const app = new App();
new MyStack(app, "infrastructure");
app.synth();
