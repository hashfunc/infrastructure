import type { TerraformResource } from "cdktf";
import type { Construct } from "constructs";

const SIGNATURE = process.env.SIGNATURE || "hashfunc/infrastructure";

export abstract class Resource<
  R extends TerraformResource & WithID,
  RC extends ResourceConfig,
> {
  protected readonly _scope: Construct;
  protected readonly _resource: R;
  protected readonly _config: RC;

  public get id() {
    return this._resource.id;
  }

  public get name() {
    return this._config.name;
  }

  public constructor(scope: Construct, config: RC) {
    this._scope = scope;
    this._config = { ...config, ...this._defautTag(config) };
    this._resource = this._create();
  }

  protected get uid() {
    return `${this._classNameLowerCase}-${this.name}`;
  }

  protected _defautTag(config: RC) {
    return {
      Name: config.name,
      [SIGNATURE]: "managed",
    };
  }

  protected abstract _create(): R;

  private get _classNameLowerCase() {
    return this.constructor.name.toLocaleLowerCase();
  }
}

export interface ResourceConfig {
  name: string;
}

interface WithID {
  id: string;
}
