import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class DelayedResponseInterceptor implements NestInterceptor {
    private logger = new Logger('DR Interceptor');

    async intercept(_ctx: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        this.logger.log(`Delaying response...`);

        await new Promise((resolve) => setTimeout(resolve, 3000));

        return next.handle();
    }
}
