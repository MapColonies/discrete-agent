import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Setting {
  @PrimaryColumn('varchar', { length: 300 })
  public key = '';

  @Column('varchar', { length: 300 })
  public value = '';

  public constructor();
  public constructor(init: Partial<Setting>);
  public constructor(key: string, value: string);
  public constructor(...args: [] | [Partial<Setting>] | [string, string]) {
    const initializerObjectLength = 1;
    const initializerParametersLength = 2;
    switch (args.length) {
      case initializerObjectLength:
        Object.assign(this, args[0]);
        break;
      case initializerParametersLength:
        this.key = args[0];
        this.value = args[1];
        break;
      default:
        break;
    }
  }
}
