import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceResource } from './entities/workspace-resource.entity';
import { WorkspaceResourcesService } from './workspace-resources.service';
import { WorkspaceResourcesController } from './workspace-resources.controller';
import { K8sModule } from '../k8s/k8s.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceResource]),
    forwardRef(() => K8sModule),
  ],
  controllers: [WorkspaceResourcesController],
  providers: [WorkspaceResourcesService],
  exports: [WorkspaceResourcesService],
})
export class WorkspaceResourcesModule {} 