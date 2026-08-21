export default function SummaryCard({ title, value, accent }) {
  const accentColors = {
    gold: "text-[#D4A843]",
    silver: "text-[#E5E7EB]",
    money: "text-emerald-400",
    deposit: "text-blue-400",
  };

  return (
    <div className="bg-[#141414] border border-[#222] rounded-2xl p-5 hover:border-[#333] transition-colors group">
      <p className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2">
        {title}
      </p>
      <h2 className={`text-[24px] font-bold leading-tight ${accentColors[accent] || "text-white"}`}>
        {value}
      </h2>
    </div>
  );
}
