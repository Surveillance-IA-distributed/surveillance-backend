import { IsOptional, IsString } from 'class-validator';

export class MakeQueryDto {
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  video_name?: string;

  @IsOptional()
  environment_type?: string;

  @IsOptional()
  object_name?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  proximity?: string;
}
