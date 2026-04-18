import * as jose from "jose";

function getJwtSecretKey(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "JWT_SECRET must be set to at least 32 characters in production"
      );
    }
    console.warn(
      "JWT_SECRET not set; using an insecure development default. Set JWT_SECRET before deploying."
    );
    return new TextEncoder().encode(
      "taskmaster-dev-only-insecure-secret-min-32-chars!!"
    );
  }
  return new TextEncoder().encode(s);
}

export async function signAccessToken(
  userId: string,
  email: string
): Promise<string> {
  const key = getJwtSecretKey();
  return new jose.SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function verifyAccessToken(
  token: string
): Promise<{ userId: string; email: string }> {
  const key = getJwtSecretKey();
  const { payload } = await jose.jwtVerify(token, key);
  const sub = payload.sub;
  const email = payload.email;
  if (typeof sub !== "string" || typeof email !== "string") {
    throw new Error("Invalid token payload");
  }
  return { userId: sub, email };
}
