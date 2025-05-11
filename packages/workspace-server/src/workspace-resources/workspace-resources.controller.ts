import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { WorkspaceResourcesService } from './workspace-resources.service';
import { WorkspaceResource } from './entities/workspace-resource.entity';

@Controller('workspace-resources')
export class WorkspaceResourcesController {
  constructor(private readonly workspaceResourcesService: WorkspaceResourcesService) {}

  @Get()
  findAll(): Promise<WorkspaceResource[]> {
    return this.workspaceResourcesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<WorkspaceResource> {
    return this.workspaceResourcesService.findOne(id);
  }

  @Post()
  create(@Body() createWorkspaceResourceDto: Partial<WorkspaceResource>): Promise<WorkspaceResource> {
    return this.workspaceResourcesService.create(createWorkspaceResourceDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWorkspaceResourceDto: Partial<WorkspaceResource>,
  ): Promise<WorkspaceResource> {
    return this.workspaceResourcesService.update(id, updateWorkspaceResourceDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.workspaceResourcesService.remove(id);
  }
} 