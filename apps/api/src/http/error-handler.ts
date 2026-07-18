import type { FastifyInstance } from "fastify"
import { ZodError } from "zod/v3";
import { Prisma } from "../../prisma/generated/client";
import { BadRequestError } from "./routes/_errors/bad-request-errors";
import { UnauthorizedError } from "./routes/_errors/unauthorized-error";

type FastifyErrorHandler = FastifyInstance['errorHandler'];

export const errorHandler: FastifyErrorHandler = (error, request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: 'Validation error.',
      error: error.flatten().fieldErrors,
    });
  }

  if (error instanceof BadRequestError) {
    return reply.status(400).send({
      message: error.message,
    });
  }

  if (error instanceof UnauthorizedError) {
    return reply.status(401).send({
      message: error.message,
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2025 = an operation failed because it depends on a record that was not found
    if (error.code === 'P2025') {
      return reply.status(404).send({
        message: 'Record not found.',
      });
    }

    // P2034 = transaction failed due to a write conflict or a deadlock
    if (error.code === 'P2034') {
      return reply.status(409).send({
        message: 'Transaction conflict, please retry.',
      });
    }
  }

  // send error to observability platform

  return reply.status(500).send({
    message: 'Internal server error'
  });
}