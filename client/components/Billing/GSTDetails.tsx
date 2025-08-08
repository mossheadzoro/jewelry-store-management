"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
 import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  GSTIN: string | undefined;
};

const GSTDetails = ({ open, setOpen, GSTIN }: Props) => {
  const [gstData, setGstData] = useState<any>(null);
  const [filing, setFiling] = useState<any>(null); // to store API data
  const GST_NUMBER = GSTIN?.toString();

  useEffect(() => {
    if (!open || !GST_NUMBER) return;

    const fetchGSTDetails = async () => {
      try {
        const res = await axios.get(
          `http://sheet.gstincheck.co.in/check/${process.env.NEXT_PUBLIC_GST_API_KEY}/${GST_NUMBER}`
        );

        const filing = await axios.get(
          `http://sheet.gstincheck.co.in/check-return/${process.env.NEXT_PUBLIC_GST_API_KEY}/${GST_NUMBER}`
        );

        setGstData(res.data?.data);
        setFiling(filing.data?.data);

        console.log(res.data);
        console.log(filing.data)
      } catch (error) {
        console.error("Error fetching GST details:", error);
        toast("Please Check Entered GST Number");
      }
    };

    fetchGSTDetails();
  }, [open, GST_NUMBER]);

  return (
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-2xl w-full">
    <DialogHeader>
      <DialogTitle className="gap-2 py-4">GST Details :-</DialogTitle>
    </DialogHeader>

    {gstData ? (
      <div className="space-y-4 text-sm text-left">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow><TableCell>GSTIN</TableCell><TableCell>{gstData.gstin}</TableCell></TableRow>
            <TableRow><TableCell>Legal Name</TableCell><TableCell>{gstData.lgnm}</TableCell></TableRow>
            <TableRow><TableCell>Trade Name</TableCell><TableCell>{gstData.tradeNam}</TableCell></TableRow>
            <TableRow><TableCell>Status</TableCell><TableCell>{gstData.sts}</TableCell></TableRow>
            <TableRow><TableCell>Constitution</TableCell><TableCell>{gstData.ctb}</TableCell></TableRow>
            <TableRow><TableCell>Registration Date</TableCell><TableCell>{gstData.rgdt}</TableCell></TableRow>
            <TableRow><TableCell>Business Types</TableCell><TableCell>{gstData.nba?.join(", ")}</TableCell></TableRow>
            <TableRow><TableCell>Address</TableCell><TableCell>{gstData.pradr?.adr}</TableCell></TableRow>
          </TableBody>
        </Table>

        {Array.isArray(filing?.filingStatus?.[0]) && filing.filingStatus[0].length > 0 ? (
          <div className="space-y-2">
            <span className="text-xl underline">Latest Filings:-</span>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Return Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filing.filingStatus[0].slice(0, 5).map((entry: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{entry.fy}</TableCell>
                      <TableCell>{entry.taxp}</TableCell>
                      <TableCell>{entry.mof}</TableCell>
                      <TableCell>{entry.dof}</TableCell>
                      <TableCell>{entry.rtntype}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No filing data available</p>
        )}
      </div>
    ) : (
      <p>Loading GST details...</p>
    )}
  </DialogContent>
</Dialog>

  );
};

export default GSTDetails;
