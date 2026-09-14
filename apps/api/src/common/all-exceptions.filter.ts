import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

/** Maps HttpExceptions and Supabase/Postgres errors to clean JSON responses. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: any, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      return res
        .status(status)
        .json(typeof body === 'string' ? { statusCode: status, message: body } : body);
    }

    const message: string = exception?.message ?? 'Internal server error';
    const code: string | undefined = exception?.code;
    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    if (code === '42501' || /row-level security/i.test(message)) status = HttpStatus.FORBIDDEN;
    else if (code === '23505') status = HttpStatus.CONFLICT;
    else if (code === '23503' || code === '23502' || code === '22P02') status = HttpStatus.BAD_REQUEST;
    else if (/not found|no rows/i.test(message)) status = HttpStatus.NOT_FOUND;

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(message, exception?.stack);
    }
    res.status(status).json({ statusCode: status, message });
  }
}
