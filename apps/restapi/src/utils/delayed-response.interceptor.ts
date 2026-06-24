import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable()
export class DelayedResponseInterceptor implements NestInterceptor {
    private logger = new Logger('DR Interceptor');

    intercept(_ctx: ExecutionContext, next: CallHandler): Observable<any> {
        this.logger.log(`Delaying response...`);

        return next.handle().pipe(delay(3000));
    }
}
