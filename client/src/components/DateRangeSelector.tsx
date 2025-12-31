import { Calendar } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function DateRangeSelector() {
  return (
    <div className="flex items-center justify-between p-6 bg-card/60 backdrop-blur-sm rounded-2xl border border-border shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-accent/20 hover:border-accent/50 hover:bg-card/80 hover:scale-[1.01] group cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-all duration-300 group-hover:scale-110">
          <Calendar className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors duration-300" />
        </div>
        <div>
          <p className="text-sm font-medium group-hover:text-accent transition-colors duration-300">Zeitraum</p>
          <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
            01. Dez. 2025 - 31. Dez. 2025
          </p>
        </div>
      </div>
      <Select defaultValue="current">
        <SelectTrigger className="w-48 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/20 transition-all duration-300">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="current">Aktueller Monat</SelectItem>
          <SelectItem value="last">Letzter Monat</SelectItem>
          <SelectItem value="quarter">Letztes Quartal</SelectItem>
          <SelectItem value="year">Letztes Jahr</SelectItem>
          <SelectItem value="custom">Benutzerdefiniert</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
