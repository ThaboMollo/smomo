import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

/** Human-readable messages for unique-constraint (23505) violations, keyed by constraint name. */
const UNIQUE_VIOLATION_MESSAGES: Record<string, string> = {
  profiles_phone_key: 'That mobile number is already registered. Please log in or use a different number.',
  profiles_email_key: 'That email is already registered. Please log in.',
};

function friendlyUniqueViolation(exception: any): string {
  const constraint: string | undefined = exception?.constraint;
  const raw: string = exception?.message ?? '';
  // supabase-js/PostgREST errors may not expose `.constraint`, so also match the message text.
  const key =
    constraint ??
    Object.keys(UNIQUE_VIOLATION_MESSAGES).find((name) => raw.includes(name));
  return (key && UNIQUE_VIOLATION_MESSAGES[key]) || 'That value is already in use.';
}

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

    const rawMessage: string = exception?.message ?? 'Internal server error';
    const code: string | undefined = exception?.code;
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = rawMessage;

    if (code === '42501' || /row-level security/i.test(rawMessage)) status = HttpStatus.FORBIDDEN;
    else if (code === '23505') {
      status = HttpStatus.CONFLICT;
      message = friendlyUniqueViolation(exception);
    } else if (code === '23503' || code === '23502' || code === '22P02') status = HttpStatus.BAD_REQUEST;
    else if (/not found|no rows/i.test(rawMessage)) status = HttpStatus.NOT_FOUND;

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(rawMessage, exception?.stack);
    }
    res.status(status).json({ statusCode: status, message });
  }
}
