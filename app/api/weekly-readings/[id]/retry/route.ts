import { PRIVATE_RESPONSE_HEADERS } from "@/lib/api-security";

export async function POST() {
  return Response.json(
    {
      error:
        "This weekly reading is generated synchronously; create it again from your account.",
    },
    { status: 409, headers: PRIVATE_RESPONSE_HEADERS },
  );
}
