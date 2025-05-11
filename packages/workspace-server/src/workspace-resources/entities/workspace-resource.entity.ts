import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('workspace_resources')
export class WorkspaceResource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  key: string;

  @Column({ nullable: true })
  namespace: string;

  @Column({ nullable: true })
  cpu: string;

  @Column({ nullable: true })
  memory: string;

  @Column({ nullable: true })
  ingressClass: string;

  @Column({ nullable: true })
  label?: string;

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 