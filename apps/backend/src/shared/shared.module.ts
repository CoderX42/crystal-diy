import { Module } from '@nestjs/common';
import { CodeGeneratorService } from './code-generator.service';
import { PosterService } from './poster.service';
import { SolarTermService } from './solar-term.service';

@Module({
  providers: [CodeGeneratorService, PosterService, SolarTermService],
  exports: [CodeGeneratorService, PosterService, SolarTermService],
})
export class SharedModule {}
