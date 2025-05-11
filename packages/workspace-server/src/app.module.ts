import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { K8sModule } from './k8s/k8s.module';
import { WorkspaceResourcesModule } from './workspace-resources/workspace-resources.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'langflow',
      password: process.env.DB_PASSWORD || 'langflow',
      database: process.env.DB_DATABASE || 'workspace',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    K8sModule,
    WorkspaceResourcesModule,
  ],
})
export class AppModule {}
