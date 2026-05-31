import { Controller, Get } from '@nestjs/common';

@Controller({
    version: '1',
    path: 'auth',
})
export class AuthController {
    @Get('/ping')
    ping() {
        return 'pong';
    }
}
