import { api } from "../../..//convex/_generated/api";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FaInstagram, FaSnapchat, FaTiktok, FaX, FaYoutube } from "react-icons/fa6";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) return redirect("/");

  // Get convex user by clerkId
  const convexUser = await convex.query(api.auth.getUserByClerkId, { clerkId: userId });
  if (!convexUser) {
    // Ensure user exists by creating/updating
    const created = await convex.mutation(api.auth.createOrUpdateUser, { clerkId: userId });
    if (!created) return redirect("/");
  }

  const userDoc = convexUser || (await convex.query(api.auth.getUserByClerkId, { clerkId: userId }));
  const userConvexId = userDoc?._id;

  if (!userConvexId) return (
    <div className="p-8">No user found.</div>
  );

  const accounts = await convex.query(api.auth.getUserLinkedAccounts, { clerkId: userId });

  return (
    <div className="p-12 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Settings</h1>
      <p className="text-base text-muted-foreground mb-8">Manage your connected Social Studio accounts.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AccountList platform="instagram" accounts={accounts!.instagram} Icon={FaInstagram} />
        <AccountList platform="youtube" accounts={accounts!.youtube} Icon={FaYoutube} />
        <AccountList platform="x" accounts={accounts!.x} Icon={FaX} />
        <AccountList platform="tiktok" accounts={accounts!.tiktok} Icon={FaTiktok} />
        <AccountList platform="snapchat" accounts={accounts!.snapchat} Icon={FaSnapchat} />
      </div>

      <div className="mt-10">
        <Link href="/dashboard" className="text-base text-muted-foreground hover:text-foreground hover:underline transition-colors">Back to Dashboard</Link>
      </div>
    </div>
  );
}

function AccountList({ platform, accounts, Icon }: { platform: string; accounts: Array<{ accountName: string; _id: string }>; Icon: any }) {
  return (
    <div className="rounded-lg bg-card p-6 border border-border/70">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 rounded bg-muted/10"><Icon className="w-6 h-6" /></div>
        <h3 className="font-semibold text-base capitalize">{platform}</h3>
      </div>

      {accounts && accounts.length > 0 ? (
        <ul className="space-y-3">
          {accounts.map((a) => (
            <li key={a._id} className="flex items-center justify-between">
              <span className="text-base text-foreground">@{a.accountName}</span>
              <span className="text-sm text-muted-foreground">Connected</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-base text-muted-foreground">No accounts connected</div>
      )}
    </div>
  );
};
}
