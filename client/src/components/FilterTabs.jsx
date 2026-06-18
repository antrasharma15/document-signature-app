import { useAuth } from "../context/AuthContext";

const FILTERS = [
  { key: "all",      label: "All" },
  { key: "draft",    label: "Draft" },
  { key: "pending",  label: "Pending" },
  { key: "signed",   label: "Signed" },
  { key: "rejected", label: "Rejected" },
  { key: "waiting",  label: "Waiting for Others" },
];

export default function FilterTabs({ activeFilter, onChange, counts }) {
  const { isDarkMode } = useAuth();

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {FILTERS.map((f) => {
        const isActive = activeFilter === f.key;
        let btnClass = "";
        if (isActive) {
          btnClass = isDarkMode ? "bg-[#528E7E] text-white" : "bg-indigo-600 text-white";
        } else {
          btnClass = isDarkMode 
            ? "bg-[#252836] text-gray-300 hover:bg-[#2D3142]" 
            : "bg-gray-100 text-gray-600 hover:bg-gray-200";
        }

        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${btnClass}`}
          >
            {f.label}
            {counts && counts[f.key] !== undefined && (
              <span className={`ml-1.5 ${isActive ? (isDarkMode ? "text-teal-200" : "text-indigo-200") : "text-gray-400"}`}>
                {counts[f.key]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
