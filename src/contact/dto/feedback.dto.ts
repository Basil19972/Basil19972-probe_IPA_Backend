import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class FeedbackDTO {
  @IsIn(['bug', 'feature', 'question'])
  type: 'bug' | 'feature' | 'question';

  @IsString()
  @IsNotEmpty()
  @MaxLength(10_000)
  message: string;
}
