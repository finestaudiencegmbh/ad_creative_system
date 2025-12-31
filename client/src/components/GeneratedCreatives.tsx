import { ImageIcon } from "lucide-react";

export function GeneratedCreatives() {
  return (
    <div className="sticky top-6">
      <div className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(95,47,175,0.15)] hover:border-[#5f2faf]/30">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-2">Generierte Creatives</h3>
          <p className="text-sm text-muted-foreground mb-6">Wähle eine Kampagne und starte die Generierung</p>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="h-20 w-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-500">
              <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">Noch keine Creatives generiert</p>
          </div>
        </div>
      </div>
    </div>
  );
}
