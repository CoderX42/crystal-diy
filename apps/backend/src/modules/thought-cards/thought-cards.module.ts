import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedModule } from '../../shared/shared.module';
import { Bracelet, BraceletSchema } from '../bracelets/bracelets.schema';
import { ThoughtCard, ThoughtCardSchema, ThoughtCardTemplate, ThoughtCardTemplateSchema } from './thought-cards.schema';
import { ThoughtCardsController } from './thought-cards.controller';
import { ThoughtCardsService } from './thought-cards.service';

@Module({
  imports: [
    JwtModule.register({}),
    SharedModule,
    MongooseModule.forFeature([
      { name: ThoughtCard.name, schema: ThoughtCardSchema },
      { name: ThoughtCardTemplate.name, schema: ThoughtCardTemplateSchema },
      { name: Bracelet.name, schema: BraceletSchema },
    ]),
  ],
  controllers: [ThoughtCardsController],
  providers: [ThoughtCardsService],
  exports: [ThoughtCardsService],
})
export class ThoughtCardsModule {}
