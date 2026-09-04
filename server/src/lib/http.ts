import type { NextFunction, Request, Response } from 'express'
import { ZodError, type TypeOf, type ZodTypeAny } from 'zod'

/** Thrown anywhere in a route to produce a clean JSON error response. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = 'error',
    public details?: unknown,
  ) {
    super(message)
  }
}

export const badRequest = (m: string, d?: unknown) => new HttpError(400, m, 'bad_request', d)
export const unauthorized = (m = 'Sign in to continue.') => new HttpError(401, m, 'unauthorized')
export const forbidden = (m = 'Your role cannot perform this action.') =>
  new HttpError(403, m, 'forbidden')
export const notFound = (m = 'Not found.') => new HttpError(404, m, 'not_found')
export const conflict = (m: string, d?: unknown) => new HttpError(409, m, 'conflict', d)

/** Wraps an async handler so a rejected promise reaches the error middleware. */
export function route<T>(handler: (req: Request, res: Response) => Promise<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch(next)
  }
}

/**
 * Validates a request body and returns the parsed, typed value.
 *
 * Inferring from the schema rather than a bare `T` keeps the *output* type, so
 * a field with `.default()` is non-optional after parsing.
 */
export function parse<S extends ZodTypeAny>(schema: S, data: unknown): TypeOf<S> {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw badRequest('Some fields need attention.', fieldErrors(result.error))
  }
  return result.data
}

function fieldErrors(error: ZodError) {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form'
    if (!out[key]) out[key] = issue.message
  }
  return out
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, code: err.code, details: err.details })
    return
  }

  // Prisma unique-constraint violations become a readable conflict.
  const prismaCode = (err as { code?: string })?.code
  if (prismaCode === 'P2002') {
    res.status(409).json({ error: 'That record already exists.', code: 'conflict' })
    return
  }
  if (prismaCode === 'P2025') {
    res.status(404).json({ error: 'Not found.', code: 'not_found' })
    return
  }

  console.error('[unhandled]', err)
  res.status(500).json({ error: 'Something went wrong on the server.', code: 'server_error' })
}

/** Cursor-free pagination helper shared by every list endpoint. */
export function paginate(query: Record<string, unknown>) {
  const page = Math.max(1, Number(query.page ?? 1) || 1)
  const perPage = Math.min(100, Math.max(1, Number(query.perPage ?? 10) || 10))
  return { page, perPage, skip: (page - 1) * perPage, take: perPage }
}

export function pageMeta(total: number, page: number, perPage: number) {
  return { total, page, perPage, pageCount: Math.max(1, Math.ceil(total / perPage)) }
}
