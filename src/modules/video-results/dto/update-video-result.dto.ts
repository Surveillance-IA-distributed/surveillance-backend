import { PartialType } from '@nestjs/mapped-types';
import { CreateVideoResultDto } from './create-video-result.dto';

export class UpdateVideoResultDto extends PartialType(CreateVideoResultDto) {}
