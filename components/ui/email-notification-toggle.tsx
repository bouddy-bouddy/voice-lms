"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EmailNotificationToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function EmailNotificationToggle({
  enabled,
  onToggle,
}: EmailNotificationToggleProps) {
  return (
    <div className="flex items-center justify-between space-y-0 rounded-md border p-3 shadow-sm">
      <div className="flex items-center space-x-2">
        <Label
          htmlFor="email-notification"
          className="flex items-center cursor-pointer"
        >
          <span>Send License Email</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="ml-1.5 h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  When enabled, an email with license details will be sent to
                  the user&apos;s email address upon creation
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
      </div>
      <Switch
        id="email-notification"
        checked={enabled}
        onCheckedChange={onToggle}
      />
    </div>
  );
}
