import { backend, BackendError } from "@/lib/backend";

/** Photo and video uploads from the product and collection editors, passed on to the backend. */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return Response.json({ error: "No file received." }, { status: 400 });
  try {
    return Response.json(await backend<{ url: string }>("/admin/uploads", { method: "POST", body: form }));
  } catch (e) {
    const status = e instanceof BackendError ? e.status : 500;
    return Response.json({ error: e instanceof Error ? e.message : "Upload failed." }, { status });
  }
}
