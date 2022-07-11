import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ProgressStatus {
  IN_PROGRESS = 'inProgress',
  TRIGGERED = 'triggered',
  FAILED = 'failed',
}

@Entity()
export class LayerHistory {
  @PrimaryColumn('varchar', { length: 300 })
  public directory = '';

  @Column('varchar', { length: 300, nullable: true })
  public layerId: string | undefined;

  @Column('varchar', { length: 30, nullable: true })
  public version: string | undefined;

  @Column({ type: 'enum', enum: ProgressStatus, default: ProgressStatus.IN_PROGRESS })
  public status: ProgressStatus | undefined;

  @CreateDateColumn()
  public createdOn?: Date;

  @UpdateDateColumn()
  public updatedOn?: Date;

  public constructor();
  public constructor(init: Partial<LayerHistory>);
  public constructor(...args: [] | [Partial<LayerHistory>]) {
    if (args.length == 1) {
      Object.assign(this, args[0]);
    }
  }
}
