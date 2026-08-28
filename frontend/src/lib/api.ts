const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

async function handle(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

export const api = {
  get: (path: string) => fetch(`${BASE_URL}${path}`).then(handle),
  post: (path: string, body: unknown) =>
    fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handle),
  postForm: (path: string, form: FormData) =>
    fetch(`${BASE_URL}${path}`, { method: "POST", body: form }).then(handle),
};
