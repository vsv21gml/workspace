import { Module, forwardRef } from '@nestjs/common';
import { K8sService } from './k8s.service';
import { WorkspaceResourcesModule } from '../workspace-resources/workspace-resources.module';

@Module({
  imports: [
    forwardRef(() => WorkspaceResourcesModule),
  ],
  providers: [K8sService],
  exports: [K8sService],
})
export class K8sModule {} 