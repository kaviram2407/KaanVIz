import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PlaceholderStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  targetPhase: string;
}

export function PlaceholderState({
  title,
  description,
  icon: Icon,
  targetPhase,
}: PlaceholderStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Card className="max-w-md text-center border-dashed border-2">
        <CardHeader className="items-center pb-2">
          <div className="p-3 rounded-full bg-primary/10 text-primary mb-2">
            <Icon className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <Badge variant="outline" className="mt-1">
            Planned for {targetPhase}
          </Badge>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-sm leading-relaxed">
            {description}
          </CardDescription>
          <div className="mt-4 p-3 bg-muted rounded-md text-xs text-muted-foreground text-left">
            <p className="font-semibold mb-1 text-foreground">Phase 1 Boundary Notice:</p>
            This route is intentionally non-functional during Phase 1 Setup. Implementation will occur according to the KaanViz roadmap sequence.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
