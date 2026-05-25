export default function SummaryCard({ title, value, accent }) {
  const accentColors = {
    gold: "text-yellow-400",
    silver: "text-gray-300",
    money: "text-green-400",
    deposit: "text-emerald-400",
  };

  return (
    <div className="bg-[#111827] p-6 rounded-2xl shadow-md border border-[#1F2937]">
      <p className="text-gray-400 text-sm mb-2">{title}</p>
      <h2 className={`text-xl font-semibold ${accentColors[accent] || ""}`}>
        {value}
      </h2>
    </div>
  );
}
