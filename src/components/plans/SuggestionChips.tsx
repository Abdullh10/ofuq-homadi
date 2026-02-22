import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

interface SuggestionChipsProps {
  suggestions: string[];
  selectedItems: string[];
  onAdd: (item: string) => void;
}

export function SuggestionChips({ suggestions, selectedItems, onAdd }: SuggestionChipsProps) {
  const available = suggestions.filter(s => !selectedItems.includes(s));
  if (available.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {available.map((s, i) => (
        <Badge
          key={i}
          variant="outline"
          className="cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors text-[11px] gap-1 py-1"
          onClick={() => onAdd(s)}
        >
          <Plus className="h-3 w-3" />
          {s.length > 40 ? s.slice(0, 40) + "..." : s}
        </Badge>
      ))}
    </div>
  );
}
