import { useAuth } from "../context/AuthContext";

const STATUS_STYLES_LIGHT = {
  draft:    "bg-gray-100 text-gray-600",
  pending:  "bg-yellow-100 text-yellow-700",
  signed:   "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const STATUS_STYLES_DARK = {
  draft:    "bg-[#2E2E38] text-gray-300",
  pending:  "bg-[#3D2E1A] text-yellow-400",
  signed:   "bg-[#1F3A30] text-emerald-400",
  rejected: "bg-[#3B1E1A] text-red-400",
};

const STATUS_LABELS = {
  draft:    "Draft",
  pending:  "Pending Signature",
  signed:   "Signed",
  rejected: "Rejected",
};

export default function StatusBadge({ status }) {
  const { isDarkMode } = useAuth();
  const styles = isDarkMode ? STATUS_STYLES_DARK : STATUS_STYLES_LIGHT;
  const style = styles[status] || styles.draft;
  const label = STATUS_LABELS[status] || status;

  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${style}`}>
      {label}
    </span>
  );
}
