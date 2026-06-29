import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { CatalogModule } from '../catalog/catalog.module';
import { ThemesController } from './themes.controller';
import { ThemeRule, ThemeRuleSchema } from './themes.schema';
import { ThemesService } from './themes.service';

@Module({
  imports: [JwtModule.register({}), CatalogModule, MongooseModule.forFeature([{ name: ThemeRule.name, schema: ThemeRuleSchema }])],
  controllers: [ThemesController],
  providers: [ThemesService],
  exports: [ThemesService],
})
export class ThemesModule {}
