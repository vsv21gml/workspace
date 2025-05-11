import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceResource } from './entities/workspace-resource.entity';
import { K8sService } from '../k8s/k8s.service';

@Injectable()
export class WorkspaceResourcesService {
  constructor(
    @InjectRepository(WorkspaceResource)
    private workspaceResourceRepository: Repository<WorkspaceResource>,
    @Inject(forwardRef(() => K8sService))
    private k8sService: K8sService,
  ) {}

  async findAll(): Promise<WorkspaceResource[]> {
    return this.workspaceResourceRepository.find();
  }

  async findOne(id: number): Promise<WorkspaceResource> {
    const resource = await this.workspaceResourceRepository.findOneBy({ id });
    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }
    return resource;
  }

  async create(data: Partial<WorkspaceResource>): Promise<WorkspaceResource> {
    if (!data.key) {
      const timestamp = new Date().getTime();
      const random = Math.floor(Math.random() * 1000);
      data.key = `langflow-${timestamp}-${random}`;
    }

    const resource = this.workspaceResourceRepository.create(data);
    const savedResource = await this.workspaceResourceRepository.save(resource);
    await this.k8sService.createLangflowResources(savedResource);
    return savedResource;
  }

  async update(id: number, data: Partial<WorkspaceResource>): Promise<WorkspaceResource> {
    await this.workspaceResourceRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const resource = await this.findOne(id);
    await this.k8sService.deleteLangflowResources(resource);
    const result = await this.workspaceResourceRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }
  }
} 