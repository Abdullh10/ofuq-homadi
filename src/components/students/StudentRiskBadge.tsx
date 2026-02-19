import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { getRiskLevelInfo, type RiskLevel } from "@/lib/analysis-engine";
import { cn } from "@/lib/utils";

interface Props {
  level: RiskLevel;
  showEmoji?: boolean;
}

export const StudentRiskBadge = React.forwardRef<HTMLDivElement, Props>(
  ({ level, showEmoji = true }, ref) => {
    const info = getRiskLevelInfo(level);
    return (
      <div ref={ref} className="inline-flex">
        <Badge variant="outline" className={cn("font-semibold", info.bgColor, info.borderColor, info.color)}>
          {showEmoji && <span className="ml-1">{info.emoji}</span>}
          {info.label}
        </Badge>
      </div>
    );
  }
);
StudentRiskBadge.displayName = "StudentRiskBadge";
