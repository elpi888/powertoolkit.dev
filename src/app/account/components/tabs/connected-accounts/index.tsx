// This tab clarifies that login methods (e.g., social logins via Clerk)
// are managed in the main User Profile provided by Clerk.
// It no longer handles any "legacy" connections or tool integrations.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react"; // Using an icon for visual cue

export const ConnectedAccounts = () => {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Info className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-medium">Login Connections</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        To manage how you log in to this application, such as linking or unlinking
        social accounts (e.g., Google, GitHub for login purposes) or managing your
        password, please visit your main User Profile.
      </p>
      <div className="mt-2">
        <Link href="/user-profile" passHref>
          <Button variant="outline">
            Go to User Profile
          </Button>
        </Link>
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        Note: Connections to external tools and services for use within workbenches
        (like authorizing Google Calendar to access its data) are managed separately within
        each workbench&apos;s settings.
      </p>
    </div>
  );
};
