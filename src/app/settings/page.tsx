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
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <p className="text-sm text-muted mb-6">Manage your connected Social Studio accounts.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AccountList platform="instagram" accounts={accounts!.instagram} Icon={FaInstagram} />
        <AccountList platform="youtube" accounts={accounts!.youtube} Icon={FaYoutube} />
        <AccountList platform="x" accounts={accounts!.x} Icon={FaX} />
        <AccountList platform="tiktok" accounts={accounts!.tiktok} Icon={FaTiktok} />
        <AccountList platform="snapchat" accounts={accounts!.snapchat} Icon={FaSnapchat} />
      </div>

      <div className="mt-8">
        <Link href="/dashboard" className="text-sm text-muted hover:underline">Back to Dashboard</Link>
      </div>
    </div>
  );
}

function AccountList({ platform, accounts, Icon }: { platform: string; accounts: Array<{ accountName: string; _id: string }>; Icon: any }) {
  return (
    <div className="rounded-lg bg-card p-4 border border-muted">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded bg-muted/10"><Icon className="w-5 h-5" /></div>
        <h3 className="font-semibold text-sm capitalize">{platform}</h3>
      </div>

      {accounts && accounts.length > 0 ? (
        <ul className="space-y-2">
          {accounts.map((a) => (
            <li key={a._id} className="flex items-center justify-between">
              <span className="text-sm text-foreground">@{a.accountName}</span>
              <span className="text-xs text-muted">Connected</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-muted">No accounts connected</div>
      )}
    </div>
  );
}
