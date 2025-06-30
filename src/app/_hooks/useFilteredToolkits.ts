import { useMemo } from "react";
import { env } from "@/env";
import { clientToolkits } from "@/toolkits/toolkits/client";
import { Toolkits as ToolkitsEnum } from "@/toolkits/toolkits/shared";

const LEGACY_TOOLKITS_TO_HIDE_WHEN_CLERK_ACTIVE: ToolkitsEnum[] = [
  ToolkitsEnum.Github,
  ToolkitsEnum.GoogleCalendar,
  ToolkitsEnum.Notion,
  ToolkitsEnum.GoogleDrive,
];

export function useFilteredToolkits() {
  const isClerkAccountsEnabled = useMemo(() => env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED, []);

  const displayableToolkitIds = useMemo(() => {
    const allIds = Object.keys(clientToolkits) as ToolkitsEnum[];
    if (isClerkAccountsEnabled) {
      return allIds.filter(id => !LEGACY_TOOLKITS_TO_HIDE_WHEN_CLERK_ACTIVE.includes(id));
    }
    return allIds;
  }, [isClerkAccountsEnabled]);

  // Also provide the raw list of clientToolkits entries, filtered
  const availableToolkitsEntries = useMemo(() => {
    return (Object.entries(clientToolkits) as [ToolkitsEnum, typeof clientToolkits[ToolkitsEnum]][]).filter(([id]) => {
      if (isClerkAccountsEnabled) {
        return !LEGACY_TOOLKITS_TO_HIDE_WHEN_CLERK_ACTIVE.includes(id);
      }
      return true;
    });
  }, [isClerkAccountsEnabled]);

  return { displayableToolkitIds, isClerkAccountsEnabled, availableToolkitsEntries };
}
