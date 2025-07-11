import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  TooltipContent,
  TooltipTrigger,
  Tooltip,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Loader2, Save, Wrench } from "lucide-react";
import { useChatContext } from "@/app/_contexts/chat-context";
import { useEffect, useState, useMemo } from "react";
import { ToolkitList } from "@/components/toolkit/toolkit-list";
import { useRouter, useSearchParams } from "next/navigation";
// import { env } from "@/env"; // Moved to hook
// import { Toolkits as ToolkitsEnum } from "@/toolkits/toolkits/shared"; // Moved to hook
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { ToolkitIcons } from "@/components/toolkit/toolkit-icons";
// import { clientToolkits } from "@/toolkits/toolkits/client"; // No longer directly needed
import { LanguageModelCapability } from "@/ai/types";
import { useFilteredToolkits } from "@/app/_hooks/useFilteredToolkits";


export const ToolsSelect = () => {
  const { toolkits, addToolkit, removeToolkit, workbench, selectedChatModel } =
    useChatContext();
  const searchParams = useSearchParams();
  const router = useRouter();

  const { displayableToolkitIds } = useFilteredToolkits();
  // isClerkAccountsEnabled also available if needed

  const [isOpen, setIsOpen] = useState(
    displayableToolkitIds.some((toolkitId) => searchParams.get(toolkitId)),
  );

  useEffect(() => {
    if (
      !isOpen &&
      displayableToolkitIds.some((toolkitId) => searchParams.get(toolkitId))
    ) {
      setIsOpen(true);
    }
  }, [isOpen, displayableToolkitIds, searchParams]); // Made dependencies exhaustive

  const { mutate: updateWorkbench, isPending } =
    api.workbenches.updateWorkbench.useMutation({
      onSuccess: () => {
        toast.success("Workbench updated successfully");
        router.refresh();
        setIsOpen(false);
      },
    });

  const handleSave = () => {
    if (workbench) {
      updateWorkbench({
        id: workbench.id,
        name: workbench.name,
        systemPrompt: workbench.systemPrompt,
        toolkitIds: toolkits.map((toolkit) => toolkit.id),
      });
    }
  };

  if (
    selectedChatModel &&
    !selectedChatModel.capabilities?.includes(
      LanguageModelCapability.ToolCalling,
    )
  ) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={"outline"}
              className="w-fit cursor-not-allowed justify-start bg-transparent opacity-50 md:w-auto md:px-2"
            >
              <Wrench />
              <span className="hidden md:block">Add Toolkits</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>This model does not support tool calling</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant={"outline"}
            className="w-fit justify-start bg-transparent md:w-auto md:px-2"
            disabled={
              !selectedChatModel?.capabilities?.includes(
                LanguageModelCapability.ToolCalling,
              )
            }
          >
            {toolkits.length > 0 ? (
              <ToolkitIcons toolkits={toolkits.map((toolkit) => toolkit.id)} />
            ) : (
              <Wrench />
            )}
            <span className="hidden md:block">
              {toolkits.length > 0
                ? `${toolkits.length} Toolkit${toolkits.length > 1 ? "s" : ""}`
                : "Add Toolkits"}
            </span>
          </Button>
        </DialogTrigger>

        <DialogContent className="flex max-h-[80vh] w-full max-w-2xl flex-col gap-4 overflow-hidden">
          <DialogHeader className="gap-0">
            <DialogTitle className="text-xl">Manage Toolkits</DialogTitle>
            <DialogDescription>
              Add or remove tools to enhance your chat experience
            </DialogDescription>
          </DialogHeader>
          <div className="h-0 flex-1 overflow-y-auto">
            <ToolkitList
              selectedToolkits={toolkits}
              onAddToolkit={addToolkit}
              onRemoveToolkit={removeToolkit}
            />
          </div>
          {workbench !== undefined && (
            <Button
              variant={"outline"}
              className="bg-transparent"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="animate-spin" /> : <Save />}
              Save
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};
