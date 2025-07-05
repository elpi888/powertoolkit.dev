"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { HStack } from "@/components/ui/stack";
import { Button } from "@/components/ui/button";
// We will need icons, e.g., from lucide-react
import { CalendarDays, Github } from "lucide-react"; // Example icons

// Data structures for Composio connections
export interface ComposioConnection {
  connectedAccountId: string;
  appName: string; // This might be 'google_calendar', 'github' etc. from Composio
  friendlyName?: string; // e.g., "Google Calendar"
  status: string; // e.g., "ACTIVE", "PENDING"
  icon?: React.ElementType;
  // integrationId?: string; // May not be needed on client if appName is sufficient
}

export interface ServiceDefinition {
  id: string; // e.g., "google_calendar" - our internal identifier
  name: string; // User-facing name e.g., "Google Calendar"
  // integrationId: string; // This will be used by the backend
  icon?: React.ElementType;
}

// Initial available services (for now, just Google Calendar)
const INITIAL_AVAILABLE_SERVICES: ServiceDefinition[] = [
  {
    id: "google_calendar",
    name: "Google Calendar",
    icon: CalendarDays,
    // integrationId is managed server-side based on the 'id'
  },
  // Future services:
  // {
  //   id: "github",
  //   name: "GitHub",
  //   icon: Github,
  // },
];


export const ConnectedAccounts = () => {
  const [connectedAccounts, setConnectedAccounts] = useState<ComposioConnection[]>([]);
  const [availableServices] = useState<ServiceDefinition[]>(INITIAL_AVAILABLE_SERVICES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // For individual button loading states
  const [isConnecting, setIsConnecting] = useState<Record<string, boolean>>({});
  const [isDisconnecting, setIsDisconnecting] = useState<Record<string, boolean>>({});

  const fetchConnectedAccounts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/composio/connections");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch connected accounts" }));
        throw new Error(errorData.error || "Failed to fetch connected accounts");
      }
      const data: ComposioConnection[] = await response.json();

      // Map appName from Composio (e.g., 'google_calendar') to friendlyName and icon
      const accountsWithDetails = data.map(acc => {
        const serviceDef = INITIAL_AVAILABLE_SERVICES.find(s => s.id === acc.appName);
        return {
          ...acc,
          friendlyName: serviceDef?.name || acc.appName,
          icon: serviceDef?.icon,
        };
      });
      setConnectedAccounts(accountsWithDetails);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      setConnectedAccounts([]); // Clear accounts on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectedAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means this runs once on mount

  // Effect to handle post-OAuth redirect
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const composioService = searchParams.get("composio_service");
    const composioStatus = searchParams.get("composio_status");

    if (composioService && composioStatus === "pending_completion") {
      // Potentially show a "Finalizing..." message to the user if desired
      // For now, just re-fetch accounts, which should pick up the new ACTIVE connection
      fetchConnectedAccounts();

      // Clean up URL query parameters
      const newUrl = `${window.location.pathname}${window.location.hash}`; // Keep hash if any
      window.history.replaceState({}, document.title, newUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount to check initial URL

  const handleDisconnect = async (connectedAccountId: string, appName: string) => {
    if (!window.confirm(`Are you sure you want to disconnect ${appName}?`)) {
      return;
    }
    setIsDisconnecting(prev => ({ ...prev, [connectedAccountId]: true }));
    setError(null);
    try {
      const response = await fetch("/api/composio/connect/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectedAccountId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Failed to disconnect ${appName}` }));
        throw new Error(errorData.error || `Failed to disconnect ${appName}`);
      }

      // Optional: show a success toast/message
      console.log(`${appName} disconnected successfully.`);

      // After successful disconnect from backend:
      fetchConnectedAccounts(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : `An unknown error occurred while disconnecting ${appName}.`);
    } finally {
      setIsDisconnecting(prev => ({ ...prev, [connectedAccountId]: false }));
    }
  };

  const handleConnect = async (serviceId: string, serviceName: string) => {
    setIsConnecting(prev => ({ ...prev, [serviceId]: true }));
    setError(null);
    try {
      const response = await fetch("/api/composio/connect/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: serviceId }), // e.g., service: "google_calendar"
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Failed to initiate connection for ${serviceName}` }));
        throw new Error(errorData.error || `Failed to initiate connection for ${serviceName}`);
      }

      const data = await response.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error(`No redirect URL received for ${serviceName}.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `An unknown error occurred while connecting ${serviceName}.`);
      setIsConnecting(prev => ({ ...prev, [serviceId]: false })); // Reset loading state on error if not redirecting
    }
    // No finally here to reset isConnecting, as successful flow redirects.
  };

  // Remove all legacy logic and old TRPC calls
  // The env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED logic is removed.
  // The api.accounts.getAccounts call is removed.

  // Placeholder rendering for now
  if (isLoading && connectedAccounts.length === 0) { // Show initial loading only if no accounts yet
    return <p>Loading connected accounts...</p>;
  }

  if (error) {
    return <p className="text-destructive">Error: {error}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-medium mb-2">Connected Accounts</h3>
        {connectedAccounts.length > 0 ? (
          <ul className="space-y-2">
            {connectedAccounts.map((acc) => (
              <li key={acc.connectedAccountId} className="flex items-center justify-between p-3 border rounded-md">
                <HStack spacing={3}>
                  {acc.icon && <acc.icon className="w-5 h-5 text-muted-foreground" />}
                  <span>{acc.friendlyName || acc.appName}</span>
                  <Badge variant={acc.status === "ACTIVE" ? "default" : "secondary"}>
                    {acc.status}
                  </Badge>
                </HStack>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDisconnect(acc.connectedAccountId, acc.friendlyName || acc.appName)}
                  disabled={isDisconnecting[acc.connectedAccountId]}
                >
                  {isDisconnecting[acc.connectedAccountId] ? "Disconnecting..." : "Disconnect"}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No accounts connected yet.</p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Available Services to Connect</h3>
        <ul className="space-y-2">
          {availableServices
            .filter(service => !connectedAccounts.some(ca => ca.appName === service.id)) // Filter out already connected
            .map((service) => (
            <li key={service.id} className="flex items-center justify-between p-3 border rounded-md">
              <HStack spacing={3}>
                {service.icon && <service.icon className="w-5 h-5 text-muted-foreground" />}
                <span>{service.name}</span>
              </HStack>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleConnect(service.id, service.name)}
                disabled={isConnecting[service.id]}
              >
                 {isConnecting[service.id] ? "Connecting..." : `Connect ${service.name}`}
              </Button>
            </li>
          ))}
        </ul>
         {availableServices.filter(service => !connectedAccounts.some(ca => ca.appName === service.id)).length === 0 && connectedAccounts.length > 0 && (
            <p className="text-muted-foreground">All available services connected.</p>
        )}
      </div>
    </div>
  );
};
