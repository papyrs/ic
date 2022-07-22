export interface EnvironmentIC extends Record<string, string | boolean> {
  managerCanisterId: string;
  feedCanisterId: string;
  feedSecret: string;
  localIdentityCanisterId?: string;
  kitPath: string;
  author: string;
}
