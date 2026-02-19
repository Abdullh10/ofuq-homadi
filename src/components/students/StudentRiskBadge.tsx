import { Badge } from "@/components/ui/badge";
import { getRiskLevelInfo, type RiskLevel } from "@/lib/analysis-engine";
import { cn } from "@/lib/utils";

interface Props {
  level: RiskLevel;
  showEmoji?: boolean;
}

export function StudentRiskBadge({ level, showEmoji = true }: Props) {
  const info = getRiskLevelInfo(level);
  return (
    <Badge variant="outline" className={cn("font-semibold", info.bgColor, info.borderColor, info.color)}>
      {showEmoji && <span className="ml-1">{info.emoji}</span>}
      {info.label}
    </Badge>
  );
}
