import { config } from "@/lib/config";

export type DevBrowserUser = {
  email?: string;
  name?: string;
  image?: string | null;
};

const DEV_USER: DevBrowserUser = {
  email: "dev@ite.local",
  name: "iTE Dev",
  image: null
};

export function getDevAuthUser(): DevBrowserUser | null {
  return config.devAuthBypass ? DEV_USER : null;
}
