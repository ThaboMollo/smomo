import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AuthGuard } from './auth/auth.guard';
import { SupabaseModule } from './supabase/supabase.module';
import { AdminModule } from './modules/admin';
import { BookingsModule } from './modules/bookings';
import { MeModule } from './modules/me';
import { OffersModule } from './modules/offers';
import { PractitionerModule } from './modules/practitioner';
import { ProvidersModule } from './modules/providers';
import { PublicModule } from './modules/public';
import { ReportsModule } from './modules/reports';
import { RequestsModule } from './modules/requests';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    SupabaseModule,
    ProvidersModule,
    RequestsModule,
    OffersModule,
    BookingsModule,
    PractitionerModule,
    MeModule,
    ReportsModule,
    AdminModule,
    PublicModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
