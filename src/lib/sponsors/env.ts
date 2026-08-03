export function env(name: string): string | undefined {
  const v = process.env[name];
  if (!v || !v.trim()) return undefined;
  return v.trim();
}

export function hasAny(...names: string[]) {
  return names.some((n) => Boolean(env(n)));
}

export const sponsorEnv = {
  rocketride: {
    auth: () => env("ROCKETRIDE_APIKEY") ?? env("ROCKETRIDE_AUTH"),
    uri: () => env("ROCKETRIDE_URI") ?? "https://api.rocketride.ai",
    configured: () => hasAny("ROCKETRIDE_APIKEY", "ROCKETRIDE_AUTH"),
  },
  falkordb: {
    host: () => env("FALKORDB_HOST") ?? env("FALKOR_HOST") ?? "127.0.0.1",
    port: () => Number(env("FALKORDB_PORT") ?? env("FALKOR_PORT") ?? "6379"),
    password: () => env("FALKORDB_PASSWORD") ?? env("FALKOR_PASSWORD"),
    configured: () => hasAny("FALKORDB_HOST", "FALKOR_HOST", "FALKORDB_URL"),
    url: () => env("FALKORDB_URL"),
  },
  linkup: {
    apiKey: () => env("LINKUP_API_KEY") ?? env("LINKUP_APIKEY"),
    configured: () => hasAny("LINKUP_API_KEY", "LINKUP_APIKEY"),
  },
  laserdata: {
    connection: () =>
      env("LASER_URI") ??
      env("LASERDATA_URI") ??
      env("LASER_CONNECTION_STRING") ??
      env("IGGY_URI"),
    stream: () => env("LASER_STREAM") ?? "continuum",
    configured: () =>
      hasAny("LASER_URI", "LASERDATA_URI", "LASER_CONNECTION_STRING", "IGGY_URI", "LASER_LOCAL"),
    preferLocal: () => env("LASER_LOCAL") === "1",
  },
  guild: {
    apiKey: () => env("GUILD_API_KEY") ?? env("GUILD_TOKEN"),
    workspace: () => env("GUILD_WORKSPACE") ?? "continuum",
    configured: () => hasAny("GUILD_API_KEY", "GUILD_TOKEN", "GUILD_HOME"),
  },
  snyk: {
    token: () => env("SNYK_TOKEN") ?? env("SNYK_API_TOKEN"),
    org: () => env("SNYK_ORG_ID"),
    configured: () => hasAny("SNYK_TOKEN", "SNYK_API_TOKEN"),
  },
};
