import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Info, Loader2 } from "lucide-react"; // Added Loader2
import { HStack, VStack } from "@/components/ui/stack";
import { clientToolkits } from "@/toolkits/toolkits/client";
import type { ClientToolkit } from "@/toolkits/types";
import { Toolkits } from "@/toolkits/toolkits/shared"; // Keep this for Toolkits enum
import { ClientToolkitConfigure } from "@/components/toolkit/toolkit-configure";
import type { SelectedToolkit } from "./types";
import { toolkitGroups } from "@/toolkits/toolkit-groups";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react"; // Added useMemo, useState
import { env } from "@/env"; // Added env
import { toast } from "sonner"; // Added toast

interface ToolkitListProps {
  selectedToolkits: SelectedToolkit[];
  onAddToolkit: (toolkit: SelectedToolkit) => void;
  onRemoveToolkit: (id: Toolkits) => void;
}

export const ToolkitList: React.FC<ToolkitListProps> = ({
  selectedToolkits,
  onAddToolkit,
  onRemoveToolkit,
}) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const useClerkAccounts = useMemo(() => env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED, []);

  const legacyToolkitsToHideWhenClerkActive: Toolkits[] = useMemo(() => [
    Toolkits.Github,
    Toolkits.GoogleCalendar,
    Toolkits.Notion,
    Toolkits.GoogleDrive,
  ], []);

  const availableToolkits = useMemo(() => {
    return Object.entries(clientToolkits).filter(([id]) => {
      if (useClerkAccounts) {
        return !legacyToolkitsToHideWhenClerkActive.includes(id as Toolkits);
      }
      return true;
    });
  }, [useClerkAccounts, legacyToolkitsToHideWhenClerkActive]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const updatedToolkits = availableToolkits.filter(([id]) => {
      return (
        searchParams.get(id) === "true" &&
        !selectedToolkits.some((t) => t.id === (id as Toolkits))
      );
    });

    if (updatedToolkits.length > 0) {
      updatedToolkits.forEach(([id, toolkit]) => {
        onAddToolkit({
          id: id as Toolkits,
          parameters: {},
          toolkit: toolkit as ClientToolkit,
        });
      });
      window.history.replaceState({}, "", pathname);
    }

  return (
    <TooltipProvider>
      <VStack className="w-full items-start gap-4">
        {toolkitGroups.map((group) => {
          return (
            <VStack key={group.id} className="w-full items-start">
              <HStack className="gap-2">
                <group.icon className="size-4" />
                <h3 className="font-bold">{group.name}</h3>
              </HStack>
              <div className="bg-muted/50 w-full rounded-md border">
                {availableToolkits
                  .filter(([, toolkit]) => toolkit.type === group.id)
                  .map(([id, toolkit]) => {
                    return (
                      <ToolkitItem
                        key={id}
                        id={id as Toolkits}
                        toolkit={toolkit as ClientToolkit}
                        selectedToolkits={selectedToolkits}
                        onAddToolkit={onAddToolkit}
                        onRemoveToolkit={onRemoveToolkit}
                      />
                    );
                  })}
              </div>
            </VStack>
          );
        })}
      </VStack>
    </TooltipProvider>
  );
};

interface ToolkitItemProps {
  id: Toolkits;
  toolkit: ClientToolkit;
  selectedToolkits: SelectedToolkit[];
  onAddToolkit: (toolkit: SelectedToolkit) => void;
  onRemoveToolkit: (id: Toolkits) => void;
}

const ToolkitItem = ({
  id,
  toolkit,
  selectedToolkits,
  onAddToolkit,
  onRemoveToolkit,
}: ToolkitItemProps) => {
  const isSelected = selectedToolkits.some((t) => t.id === id);
  const needsConfiguration = Object.keys(toolkit.parameters.shape).length > 0;
  const [isLoading, setIsLoading] = useState(false);

  // Toolkits that require Composio OAuth flow
  const oauthToolkits: Toolkits[] = [
    Toolkits.Notion,
    Toolkits.GoogleCalendar,
    Toolkits.GoogleDrive,
    Toolkits.Github,
    Toolkits.Exa,
  ];

  const requiresComposioOAuth = oauthToolkits.includes(id);

  const handleConnectService = async (serviceId: Toolkits) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/composio/connect/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: serviceId.toLowerCase() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to initiate connection for ${serviceId}`);
      }

      const { redirectUrl } = await response.json();
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        throw new Error(`No redirectUrl received for ${serviceId}`);
      }
    } catch (error) {
      console.error("Error initiating Composio connection:", error);
      toast.error(error instanceof Error ? error.message : `Could not connect ${serviceId}.`);
      setIsLoading(false);
    }
    // setIsLoading(false) will not be reached if redirect happens.
    // If the redirect fails, or if there's an error before redirecting, then it's set to false.
  };

  const addToolkitButtons = isSelected ? (
    <Button
      size="sm"
      onClick={() => onRemoveToolkit(id)}
      className="user-message"
      type="button"
    >
      Active
    </Button>
  ) : requiresComposioOAuth ? (
    <Button
      variant="outline"
      size="sm"
      onClick={() => handleConnectService(id)}
      className="bg-transparent"
      type="button"
      disabled={isLoading}
    >
      {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Plus className="mr-2 size-4" />}
      Connect
    </Button>
  ) : needsConfiguration ? (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-transparent"
          type="button"
          disabled={isLoading} // Should not be loading if not OAuth, but for safety
        >
          Add
          <Plus className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <ClientToolkitConfigure
          toolkit={toolkit}
          id={id}
          schema={toolkit.parameters}
          onAdd={onAddToolkit} // This onAdd might need adjustment if config itself should trigger OAuth
        />
      </PopoverContent>
    </Popover>
  ) : (
    // Default "Add" button for toolkits that don't need special OAuth and don't have parameters
    <Button
      variant="outline"
      size="sm"
      onClick={() => onAddToolkit({ id, toolkit, parameters: {} })}
      className="bg-transparent"
      type="button"
    >
      Add
      <Plus className="size-4" />
    </Button>
  );

  return (
    <div key={id} className="border-border/50 border-b p-2 last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 flex-col">
          <HStack>
            <toolkit.icon className="size-4" />
            <h3 className="text-sm font-medium">{toolkit.name}</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="text-muted-foreground size-3 cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-64">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Available Tools</p>
                  <ul className="space-y-1">
                    {Object.entries(toolkit.tools).map(([name, tool]) => (
                      <li key={name} className="flex items-start gap-2">
                        <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current" />
                        <p className="text-xs">{tool.description}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </HStack>
          <p className="text-muted-foreground text-xs">{toolkit.description}</p>
        </div>

        <div className="flex w-28 justify-end gap-2">
          {toolkit.addToolkitWrapper ? (
            <toolkit.addToolkitWrapper>
              {addToolkitButtons}
            </toolkit.addToolkitWrapper>
          ) : (
            addToolkitButtons
          )}
        </div>
      </div>
    </div>
  );
};
