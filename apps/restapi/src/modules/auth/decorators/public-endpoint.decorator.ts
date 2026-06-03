import { IS_PUBLIC_RESOURCE_KEY } from '@/common/constant/public.decorator';
import { SetMetadata } from '@nestjs/common';

export const Public = () => SetMetadata(IS_PUBLIC_RESOURCE_KEY, true);
