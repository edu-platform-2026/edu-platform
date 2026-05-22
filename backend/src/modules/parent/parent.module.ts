import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ParentController } from './parent.controller';
import { ParentService } from './parent.service';

@Module({
  imports: [PrismaModule],
  controllers: [ParentController],
  providers: [ParentService],
  exports: [ParentService],
})
export class ParentModule {}