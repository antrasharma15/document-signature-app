const STATUS_STYLES = {
  draft:    "bg-gray-100 text-gray-600",
  pending:  "bg-yellow-100 text-yellow-700",
  signed:   "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const STATUS_LABELS = {
  draft:    "Draft",
  pending:  "Pending Signature",
  signed:   "Signed",
  rejected: "Rejected",
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.draft;
  const label = STATUS_LABELS[status] || status;

  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${style}`}>
      {label}
    </span>
  );
}
