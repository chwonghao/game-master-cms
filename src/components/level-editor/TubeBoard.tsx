"use client";

type TubeBoardProps = {
  tubes: string[][];
  selectedTube: number | null;
  tubeCapacity: number;
  onTubeClick: (index: number) => void;
  onWoolDrop: (from: number, to: number) => void;
};

export function TubeBoard({
  tubes,
  selectedTube,
  tubeCapacity,
  onTubeClick,
  onWoolDrop,
}: TubeBoardProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      {tubes.map((tube, tubeIndex) => {
        const isSelected = selectedTube === tubeIndex;
        const hasWool = tube.length > 0;

        return (
          <button
            key={`tube-${tubeIndex}`}
            type="button"
            onClick={() => onTubeClick(tubeIndex)}
            draggable={hasWool}
            onDragStart={(event) => {
              event.dataTransfer.setData("text/tube-from", String(tubeIndex));
              event.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }}
            onDrop={(event) => {
              event.preventDefault();
              const fromValue = event.dataTransfer.getData("text/tube-from");
              const fromIndex = Number(fromValue);

              if (!Number.isNaN(fromIndex)) {
                onWoolDrop(fromIndex, tubeIndex);
              }
            }}
            className={`group rounded-2xl border p-3 transition ${
              isSelected
                ? "border-cyan-300 bg-cyan-500/10"
                : "border-slate-700 bg-slate-900/60 hover:border-cyan-500/50"
            }`}
          >
            <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-400">
              <span>Tube {tubeIndex + 1}</span>
              <span>{tube.length}/{tubeCapacity}</span>
            </div>

            <div className="mx-auto flex h-52 w-20 flex-col-reverse gap-1 rounded-b-3xl rounded-t-xl border-2 border-slate-600/80 bg-slate-950/80 p-2 shadow-inner shadow-slate-950">
              {Array.from({ length: tubeCapacity }).map((_, slotIndex) => {
                const woolColor = tube[slotIndex];

                return (
                  <div
                    key={`slot-${tubeIndex}-${slotIndex}`}
                    className={`h-9 rounded-lg border border-slate-800 transition ${
                      woolColor ? "scale-100" : "bg-slate-900/70"
                    }`}
                    style={woolColor ? { backgroundColor: woolColor } : undefined}
                  />
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}
