import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'nestjs-pino';
import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import { validationSchema } from './config/validation.schema';
import { AccountStatusModule } from './infrastructure/account-status/account-status.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminAuthModule } from './modules/admin-auth/admin-auth.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { AdminUsersModule } from './modules/admin-users/admin-users.module';
import { FileModule } from './modules/file/file.module';
import { UsersModule } from './modules/users/users.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ThemesModule } from './modules/themes/themes.module';
import { DesignsModule } from './modules/designs/designs.module';
import { CartsModule } from './modules/carts/carts.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AfterSalesModule } from './modules/after-sales/after-sales.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { BraceletsModule } from './modules/bracelets/bracelets.module';
import { ThoughtCardsModule } from './modules/thought-cards/thought-cards.module';
import { ContentModule } from './modules/content/content.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './modules/health/health.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [appConfig, jwtConfig],
      validationSchema,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true } },
      },
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
    }),
    AccountStatusModule,
    SharedModule,
    AuthModule,
    AdminAuthModule,
    RbacModule,
    AdminUsersModule,
    FileModule,
    UsersModule,
    CatalogModule,
    ThemesModule,
    DesignsModule,
    CartsModule,
    OrdersModule,
    PaymentsModule,
    AfterSalesModule,
    ReviewsModule,
    BraceletsModule,
    ThoughtCardsModule,
    ContentModule,
    DashboardModule,
    AuditModule,
    HealthModule,
  ],
})
export class AppModule {}
