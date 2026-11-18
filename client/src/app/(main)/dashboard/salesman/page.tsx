import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Briefcase, 
  Calendar, 
  CreditCard, 
  TrendingUp,
  Award,
  DollarSign
} from "lucide-react";

export default async function SalesmanDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SALESMAN") {
    redirect("/login");
  }

  const salesman = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      branch: true,
      role: true,
    },
  });

  if (!salesman) {
    return <div className="p-8 text-center text-rose-500 font-semibold text-lg bg-onyx h-full">User not found.</div>;
  }

  return (
    <div className="min-h-screen flex-1 w-full bg-onyx p-4 md:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between bg-onyx-surface p-6 rounded-2xl border border-onyx-border shadow-sm">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-onyx-elevated border border-gold/30 rounded-full flex items-center justify-center text-gold text-3xl font-bold shadow-inner overflow-hidden">
            {salesman.photo ? (
              <img src={salesman.photo} alt={salesman.name} className="w-full h-full object-cover" />
            ) : (
              salesman.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">
              {salesman.name}
            </h1>
            <div className="flex items-center space-x-2 text-platinum-muted text-sm font-medium">
              <Award className="w-4 h-4 text-gold" />
              <span>{salesman.systemRole.replace("_", " ")}</span>
              {salesman.branch && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-300">{salesman.branch.name}</span>
                </>
              )}
            </div>
            <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded border border-emerald-500/30 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400">
              Status: {salesman.status}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Details Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-onyx-surface rounded-2xl p-6 border border-onyx-border shadow-sm relative overflow-hidden group">
            <h2 className="text-[15px] font-semibold text-platinum mb-6 flex items-center">
              <User className="w-5 h-5 mr-2 text-gold" />
              Personal Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <Mail className="w-4 h-4 text-zinc-500 mt-0.5" />
                <div>
                  <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Email Address</p>
                  <p className="text-sm text-platinum-muted mt-0.5">{salesman.email}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Phone className="w-4 h-4 text-zinc-500 mt-0.5" />
                <div>
                  <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Phone Number</p>
                  <p className="text-sm text-platinum-muted mt-0.5">{salesman.phone || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-zinc-500 mt-0.5" />
                <div>
                  <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Address</p>
                  <p className="text-sm text-platinum-muted mt-0.5">{salesman.address || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Briefcase className="w-4 h-4 text-zinc-500 mt-0.5" />
                <div>
                  <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Department</p>
                  <p className="text-sm text-platinum-muted mt-0.5">{salesman.department || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Calendar className="w-4 h-4 text-zinc-500 mt-0.5" />
                <div>
                  <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Joining Date</p>
                  <p className="text-sm text-platinum-muted mt-0.5">
                    {salesman.joiningDate ? new Date(salesman.joiningDate).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CreditCard className="w-4 h-4 text-zinc-500 mt-0.5" />
                <div>
                  <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Identity (PAN/Aadhar)</p>
                  <p className="text-sm text-platinum-muted mt-0.5">
                    {salesman.panNumber ? `PAN: ${salesman.panNumber}` : "PAN: N/A"} <br/>
                    {salesman.aadharNumber ? `Aadhar: ${salesman.aadharNumber}` : "Aadhar: N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance & Metrics */}
        <div className="space-y-6">
          <div className="bg-onyx-elevated border border-gold/20 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <TrendingUp className="w-32 h-32 text-gold" />
            </div>
            <h2 className="text-[15px] font-semibold text-platinum mb-6 flex items-center relative z-10">
              <TrendingUp className="w-5 h-5 mr-2 text-gold" />
              Performance Stats
            </h2>
            
            <div className="space-y-6 relative z-10">
              <div>
                <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold mb-1">Total Sales</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-extrabold text-gold font-mono">
                    ₹{(salesman.totalSales || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="w-full h-px bg-onyx-border" />

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Commission Status</p>
                  <p className="font-medium mt-1 text-sm flex items-center">
                    {salesman.isCommissionBased ? (
                      <span className="text-emerald-400 flex items-center"><DollarSign className="w-3.5 h-3.5 mr-1"/> Active</span>
                    ) : (
                      <span className="text-zinc-500">Inactive</span>
                    )}
                  </p>
                </div>
                {salesman.isCommissionBased && (
                  <div className="text-right">
                    <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Rate</p>
                    <p className="font-semibold mt-1 text-sm text-platinum">
                      {salesman.commissionRate ? `${salesman.commissionRate}%` : "0%"}
                    </p>
                  </div>
                )}
              </div>

              <div className="w-full h-px bg-onyx-border" />

              <div>
                <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Last Sale Date</p>
                <p className="font-medium mt-1 text-sm text-platinum-muted">
                  {salesman.lastSaleDate ? new Date(salesman.lastSaleDate).toLocaleString() : "No sales yet"}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
