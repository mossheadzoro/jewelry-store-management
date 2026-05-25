export default function StatusBadge({ status }) {
  const styles = {
    Active: "bg-green-500/20 text-green-400",
    Inactive: "bg-yellow-500/20 text-yellow-400",
    Suspended: "bg-red-500/20 text-red-400",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}
