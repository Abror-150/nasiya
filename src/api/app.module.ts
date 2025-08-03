import { forwardRef, Module } from '@nestjs/common';
import { SellerModule } from './seller/seller.module';
import { PrismaModule } from 'src/infrastructure/lib/prisma/prisma.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { MijozModule } from './mijoz/mijoz.module';
import { DebtModule } from './debt/debt.module';
import { TolovlarModule } from './tolovlar/tolovlar.module';
import { UploadController } from './upload/upload.controller';
import { MessageModule } from './message/message.module';
import { ExampleModule } from './example/example.module';

@Module({
  imports: [
    SellerModule,
    PrismaModule,
    AdminModule,
    AuthModule,
    MijozModule,
    DebtModule,
    TolovlarModule,
    MessageModule,
    ExampleModule,
  ],
  controllers: [UploadController],
})
export class AppModule {}
