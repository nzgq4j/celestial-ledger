import "server-only";
import { headers } from "next/headers";
import { appPlatformFromUserAgent, type AppPlatform } from "./detect";

export async function getAppPlatform(): Promise<AppPlatform> {
  const requestHeaders = await headers();
  return appPlatformFromUserAgent(requestHeaders.get("user-agent"));
}
