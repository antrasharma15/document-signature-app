const FILTERS = [
  { key: "all",      label: "All" },
  { key: "draft",    label: "Draft" },
  { key: "pending",  label: "Pending" },
  { key: "signed",   label: "Signed" },
  { key: "rejected", label: "Rejected" },
  { key: "waiting",  label: "Waiting for Others" },
];

export default function FilterTabs({ activeFilter, onChange, counts }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {FILTERS.map((f) => {
        const isActive = activeFilter === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
              ${isActive
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {f.label}
            {counts && counts[f.key] !== undefined && (
              <span className={`ml-1.5 ${isActive ? "text-indigo-200" : "text-gray-400"}`}>
                {counts[f.key]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
