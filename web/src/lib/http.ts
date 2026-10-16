import { z, ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function handle<C = unknown>(fn: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
      if (e instanceof ZodError) {
        return Response.json(
          { error: "invalid_input", fields: z.flattenError(e).fieldErrors },
          { status: 400 },
        );
      }
      if (e instanceof SyntaxError) return Response.json({ error: "invalid_input" }, { status: 400 });
      console.error(e);
      return Response.json({ error: "server" }, { status: 500 });
    }
  };
}

/** Reads `[id]` from the route and rejects anything that is not a UUID with 404. */
export async function uuidParam(ctx: { params: Promise<{ id: string }> }): Promise<string> {
  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) throw new HttpError(404, "not_found");
  return id;
}