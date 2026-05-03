import { query } from "./_generated/server";

export const ping = query({
  args: {},
  handler: async () => {
    return { message: "Lume · Convex connected" };
  },
});
