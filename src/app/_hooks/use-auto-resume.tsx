"use client";

import { useEffect } from "react";

import type { UIMessage } from "ai";
import type { UseChatHelpers } from "@ai-sdk/react";

type DataPart = { type: "append-message"; message: string };

export interface UseAutoResumeParams {
  autoResume: boolean;
  initialMessages: UIMessage[];
  experimental_resume: UseChatHelpers["experimental_resume"];
  data: UseChatHelpers["data"];
  setMessages: UseChatHelpers["setMessages"];
}

export function useAutoResume({
  autoResume,
  initialMessages,
  experimental_resume,
  data,
  setMessages,
}: UseAutoResumeParams) {
  useEffect(() => {
    if (!autoResume) return;

    const mostRecentMessage = initialMessages.at(-1);

    if (mostRecentMessage?.role === "user") {
      experimental_resume?.(); // Optional chaining
    }

    // we intentionally run this once, but list deps for ESLint's parser to avoid internal crash
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoResume, initialMessages, experimental_resume]);

  useEffect(() => {
    if (!data) return;
    if (data.length === 0) return;

    const dataPart = data[0] as DataPart;

    if (dataPart.type === "append-message") {
      const message = JSON.parse(dataPart.message) as UIMessage;
      setMessages([...initialMessages, message]);
    }
  }, [data, initialMessages, setMessages]);
}
