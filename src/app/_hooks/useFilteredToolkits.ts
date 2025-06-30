import { useMemo } from "react";
import { env } from "@/env";
import { clientToolkits } from "@/toolkits/toolkits/client";
import { Toolkits as ToolkitsEnum } from "@/toolkits/toolkits/shared";

export function useFilteredToolkits() {
  const isClerkAccountsEnabled = useMemo(() => env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED, []);

  const legacyToolkitsToHideWhenClerkActive: ToolkitsEnum[] = useMemo(() => [
    ToolkitsEnum.Github,
    ToolkitsEnum.GoogleCalendar,
    ToolkitsEnum.Notion,
    ToolkitsEnum.GoogleDrive,
  ], []);

  const displayableToolkitIds = useMemo(() => {
    const allIds = Object.keys(clientToolkits) as ToolkitsEnum[];
    if (isClerkAccountsEnabled) {
      return allIds.filter(id => !legacyToolkitsToHideWhenClerkActive.includes(id));
    }
    return allIds;
  }, [isClerkAccountsEnabled, legacyToolkitsToHideWhenClerkActive]);

  // Also provide the raw list of clientToolkits entries, filtered
  const availableToolkitsEntries = useMemo(() => {
    return (Object.entries(clientToolkits) as [ToolkitsEnum, typeof clientToolkits[ToolkitsEnum]][]).filter(([id]) => {
      if (isClerkAccountsEnabled) {
        return !legacyToolkitsToHideWhenClerkActive.includes(id);
      }
      return true;
    });
  }, [isClerkAccountsEnabled, legacyToolkitsToHideWhenClerkActive]);

  return { displayableToolkitIds, isClerkAccountsEnabled, availableToolkitsEntries };
}
