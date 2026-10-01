import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PlaceholderStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  targetPhase?: string;
  statusBadge?: string;
  notice?: string;
}

export function PlaceholderState({
  title,
  description,
  icon: Icon,
  targetPhase,
  statusBadge = "Future Release",
  notice,
}: PlaceholderStateProps) {
  const badgeLabel = statusBadge || (targetPhase ? `Planned for ${targetPhase}` : "Future Release");
  const noticeContent = notice || description;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Card className="max-w-md text-center border-dashed border-2">
        <CardHeader className="items-center pb-2">
          <div className="p-3 rounded-full bg-primary/10 text-primary mb-2">
            <Icon className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <Badge variant="outline" className="mt-1">
            {badgeLabel}
          </Badge>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm leading-relaxed">
            {description}
          </CardDescription>
          <div className="mt-4 p-3 bg-muted rounded-md text-xs text-muted-foreground text-left">
            <p className="font-semibold mb-1 text-foreground">Notice:</p>
            {noticeContent}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
