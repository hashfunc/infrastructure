import type { TerraformResource } from "cdktf";
import type { Construct } from "constructs";

const SIGNATURE = process.env.SIGNATURE || "hashfunc";

export abstract class Resource<R extends TerraformResource & WithID, RC> {
  protected readonly _resource: R;
  protected readonly _config: RC;

  public get id() {
    return this._resource.id;
  }

  public get name() {
    return this._name;
  }

  public constructor(
    protected _scope: Construct,
    private _name: string,
    config: RC,
  ) {
    this._config = { ...config, tags: this._defautTag() };
    this._resource = this._create();
  }

  protected get uid() {
    return `${this._classNameLowerCase}-${this.name}`;
  }

  protected _defautTag() {
    return {
      Name: this.name,
      [`${SIGNATURE}/uid`]: this.uid,
    };
  }

  protected abstract _create(): R;

  private get _classNameLowerCase() {
    return this.constructor.name.toLocaleLowerCase();
  }
}

interface WithID {
  id: string;
}
