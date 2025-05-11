import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as k8s from '@kubernetes/client-node';
import { WorkspaceResource } from '../workspace-resources/entities/workspace-resource.entity';
import { WorkspaceResourcesService } from '../workspace-resources/workspace-resources.service';

@Injectable()
export class K8sService {
  private readonly kc: k8s.KubeConfig;
  private readonly k8sApi: k8s.CoreV1Api;
  private readonly k8sAppsApi: k8s.AppsV1Api;
  private readonly k8sNetworkingApi: k8s.NetworkingV1Api;
  private readonly logger = new Logger(K8sService.name);
  private syncInterval: NodeJS.Timeout;

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => WorkspaceResourcesService))
    private workspaceResourcesService: WorkspaceResourcesService
  ) {
    this.kc = new k8s.KubeConfig();
    this.kc.loadFromDefault();
    
    this.k8sApi = this.kc.makeApiClient(k8s.CoreV1Api);
    this.k8sAppsApi = this.kc.makeApiClient(k8s.AppsV1Api);
    this.k8sNetworkingApi = this.kc.makeApiClient(k8s.NetworkingV1Api);

    // 현재 K8s 컨텍스트 로깅
    const currentContext = this.kc.getCurrentContext();
    this.logger.log(`Current K8s context: ${currentContext}`);

    // 동기화 작업 시작
    this.startSync();
  }

  private startSync() {
    // 5초마다 동기화 실행
    this.syncInterval = setInterval(() => {
      this.syncResources().catch(error => {
        this.logger.error('Failed to sync resources:', error);
      });
    }, 5000);
  }

  async onModuleDestroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }

  private async syncResources() {
    try {
      // DB에서 모든 리소스 가져오기
      const dbResources = await this.getAllResourcesFromDB();
      
      for (const dbResource of dbResources) {
        try {
          // K8s 리소스 존재 여부 확인
          const exists = await this.verifyResources(dbResource);
          
          if (!exists) {
            this.logger.log(`Resource ${dbResource.key} not found in K8s, recreating...`);
            await this.createK8sResources(dbResource);
          }
        } catch (error) {
          this.logger.error(`Failed to sync resource ${dbResource.key}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Failed to sync resources:', error);
    }
  }

  private async getAllResourcesFromDB(): Promise<WorkspaceResource[]> {
    return this.workspaceResourcesService.findAll();
  }

  private async verifyResources(resource: WorkspaceResource): Promise<boolean> {
    try {
      const namespace = resource.namespace || 'workspace';
      
      // PVC 확인
      const pvc = await this.k8sApi.readNamespacedPersistentVolumeClaim({
        name: `${resource.key}-pvc`,
        namespace,
      }).catch(() => null);
      
      // Deployment 확인
      const deployment = await this.k8sAppsApi.readNamespacedDeployment({
        name: resource.key,
        namespace,
      }).catch(() => null);
      
      // Service 확인
      const service = await this.k8sApi.readNamespacedService({
        name: resource.key,
        namespace,
      }).catch(() => null);
      
      // Ingress 확인
      const ingress = await this.k8sNetworkingApi.readNamespacedIngress({
        name: resource.key,
        namespace,
      }).catch(() => null);

      return !!(pvc && deployment && service && ingress);
    } catch (error) {
      this.logger.error(`Failed to verify resources for ${resource.key}:`, error);
      return false;
    }
  }

  private async createK8sResources(resource: WorkspaceResource) {
    const namespace = resource.namespace || 'workspace';
    
    try {
      // 네임스페이스 생성
      await this.k8sApi.createNamespace({
        body: {
          apiVersion: 'v1',
          kind: 'Namespace',
          metadata: {
            name: namespace,
          },
        },
      }).catch(() => {
        this.logger.log(`Namespace ${namespace} already exists`);
      });

      // PVC 생성
      await this.k8sApi.createNamespacedPersistentVolumeClaim({
        namespace,
        body: {
          apiVersion: 'v1',
          kind: 'PersistentVolumeClaim',
          metadata: {
            name: `${resource.key}-pvc`,
          },
          spec: {
            accessModes: ['ReadWriteOnce'],
            resources: {
              requests: {
                storage: '10Gi',
              },
            },
          },
        },
      });

      // Deployment 생성
      const resources: k8s.V1ResourceRequirements = {
        requests: {},
        limits: {},
      };

      if (resource.cpu !== '0') {
        if (!resources.requests) resources.requests = {};
        if (!resources.limits) resources.limits = {};
        resources.requests.cpu = resource.cpu;
        resources.limits.cpu = resource.cpu;
      }

      if (resource.memory !== '0') {
        if (!resources.requests) resources.requests = {};
        if (!resources.limits) resources.limits = {};
        resources.requests.memory = resource.memory;
        resources.limits.memory = resource.memory;
      }

      await this.k8sAppsApi.createNamespacedDeployment({
        namespace,
        body: {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          metadata: {
            name: resource.key,
          },
          spec: {
            replicas: 1,
            selector: {
              matchLabels: {
                app: resource.key,
              },
            },
            template: {
              metadata: {
                labels: {
                  app: resource.key,
                },
              },
              spec: {
                containers: [
                  {
                    name: 'langflow',
                    image: 'langflowai/langflow:1.4.1',
                    ports: [
                      {
                        containerPort: 7860,
                      },
                    ],
                    volumeMounts: [
                      {
                        name: 'data',
                        mountPath: '/app/data',
                      },
                    ],
                    resources,
                    env: [
                      {
                        name: 'LANGFLOW_SUPERUSER',
                        value: 'admin',
                      },
                      {
                        name: 'LANGFLOW_SUPERUSER_PASSWORD',
                        value: 'admin',
                      },
                    ],
                  },
                ],
                volumes: [
                  {
                    name: 'data',
                    persistentVolumeClaim: {
                      claimName: `${resource.key}-pvc`,
                    },
                  },
                ],
              },
            },
          },
        },
      });

      // Service 생성
      await this.k8sApi.createNamespacedService({
        namespace,
        body: {
          apiVersion: 'v1',
          kind: 'Service',
          metadata: {
            name: resource.key,
          },
          spec: {
            selector: {
              app: resource.key,
            },
            ports: [
              {
                port: 80,
                targetPort: 7860,
              },
            ],
          },
        },
      });

      // Ingress 생성
      await this.k8sNetworkingApi.createNamespacedIngress({
        namespace,
        body: {
          apiVersion: 'networking.k8s.io/v1',
          kind: 'Ingress',
          metadata: {
            name: resource.key,
            annotations: {
              'kubernetes.io/ingress.class': resource.ingressClass || 'nginx',
            },
          },
          spec: {
            rules: [
              {
                host: `${resource.key}.example.com`,
                http: {
                  paths: [
                    {
                      path: '/',
                      pathType: 'Prefix',
                      backend: {
                        service: {
                          name: resource.key,
                          port: {
                            number: 80,
                          },
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      });

      this.logger.log(`Successfully created all resources for ${resource.key}`);
    } catch (error) {
      this.logger.error(`Failed to create resources for ${resource.key}:`, error);
      throw error;
    }
  }

  async createLangflowResources(resource: WorkspaceResource) {
    return this.createK8sResources(resource);
  }

  async deleteLangflowResources(resource: WorkspaceResource) {
    const namespace = resource.namespace || 'workspace';
    
    try {
      // Ingress 삭제
      await this.k8sNetworkingApi.deleteNamespacedIngress({
        name: resource.key,
        namespace,
      }).catch(() => {
        this.logger.log(`Ingress ${resource.key} not found`);
      });

      // Service 삭제
      await this.k8sApi.deleteNamespacedService({
        name: resource.key,
        namespace,
      }).catch(() => {
        this.logger.log(`Service ${resource.key} not found`);
      });

      // Deployment 삭제
      await this.k8sAppsApi.deleteNamespacedDeployment({
        name: resource.key,
        namespace,
      }).catch(() => {
        this.logger.log(`Deployment ${resource.key} not found`);
      });

      // PVC 삭제
      await this.k8sApi.deleteNamespacedPersistentVolumeClaim({
        name: `${resource.key}-pvc`,
        namespace,
      }).catch(() => {
        this.logger.log(`PVC ${resource.key}-pvc not found`);
      });

      this.logger.log(`Successfully deleted all resources for ${resource.key}`);
    } catch (error) {
      this.logger.error(`Failed to delete resources for ${resource.key}:`, error);
      throw error;
    }
  }
} 