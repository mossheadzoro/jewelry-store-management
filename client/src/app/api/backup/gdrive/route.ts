import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import crypto from "crypto";
import fs from "fs";
import path from "path";

async function getOrRefreshAccessToken(customAccessToken?: string): Promise<string | null> {
  if (customAccessToken && customAccessToken.startsWith("ya29.")) return customAccessToken;

  const refreshToken = process.env.GDRIVE_REFRESH_TOKEN;
  const clientId = process.env.GDRIVE_CLIENT_ID || "";
  const clientSecret = process.env.GDRIVE_CLIENT_SECRET || "";

  if (refreshToken) {
    try {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token"
        })
      });

      const tokenData = await res.json();
      if (tokenData.access_token) {
        process.env.GDRIVE_ACCESS_TOKEN = tokenData.access_token;
        return tokenData.access_token;
      }
    } catch (err) {
      console.warn("Failed to refresh Google Drive access token using refresh_token:", err);
    }
  }

  return process.env.GDRIVE_ACCESS_TOKEN || null;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.systemRole || session?.user?.role;
    
    // Strict Admin Verification
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Only system Administrators can access Google Drive Backups." }, { status: 403 });
    }

    // Fetch backup history from BackupLog
    const logs = await prisma.backupLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const formattedLogs = logs.map((log: any) => {
      let driveFileId = log.driveFileId;
      let driveFileUrl = log.driveFileUrl;
      let branchScope = log.branchScope || "SINGLE";
      let status = log.status || "SUCCESS";
      let type = log.type || "BACKUP";
      let recordCounts = log.recordCounts;

      if (!driveFileId && Array.isArray(log.includes)) {
        for (const item of log.includes) {
          if (typeof item === "string") {
            if (item.startsWith("META:GDRIVE_ID:")) driveFileId = item.replace("META:GDRIVE_ID:", "");
            if (item.startsWith("META:GDRIVE_URL:")) driveFileUrl = item.replace("META:GDRIVE_URL:", "");
            if (item.startsWith("META:SCOPE:")) branchScope = item.replace("META:SCOPE:", "");
            if (item.startsWith("META:STATUS:")) status = item.replace("META:STATUS:", "");
            if (item.startsWith("META:TYPE:")) type = item.replace("META:TYPE:", "");
            if (item.startsWith("META:COUNTS:")) {
              try { recordCounts = JSON.parse(item.replace("META:COUNTS:", "")); } catch (e) {}
            }
          }
        }
      }

      return {
        ...log,
        driveFileId: driveFileId || log.id,
        driveFileUrl: driveFileUrl || `/backups/Backup_${log.id}.json`,
        branchScope,
        status,
        type,
        recordCounts: recordCounts || { invoices: 0, stock: 0, customers: 0, payments: 0 }
      };
    });

    return NextResponse.json({ 
      success: true, 
      backups: formattedLogs,
      gdriveConnected: !!(process.env.GDRIVE_REFRESH_TOKEN || process.env.GDRIVE_ACCESS_TOKEN)
    }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch Google Drive backups:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch backups" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.systemRole || session?.user?.role;
    const createdById = session?.user?.id ? parseInt(session.user.id) : 1;

    // Strict Admin Verification
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Only system Administrators can trigger Google Drive Backups." }, { status: 403 });
    }

    const body = await req.json();
    const { 
      branchScope = "ALL", // "ALL" or "SINGLE"
      branchId, 
      includes = ["invoices", "payments", "customers", "stock", "stockLedger", "karigar"],
      gdriveFolderId,
      gdriveAccessToken
    } = body;

    const targetFolderId = gdriveFolderId || process.env.GDRIVE_FOLDER_ID || "12XQxuTB_fOABKPJ9ziFykajKxbgZuVXX";
    const activeAccessToken = await getOrRefreshAccessToken(gdriveAccessToken);

    const parsedBranchId = branchScope === "SINGLE" && branchId ? parseInt(branchId) : null;

    const backupData: any = {};

    // 0. Fetch Branch Info
    backupData.branches = await prisma.branch.findMany({
      where: parsedBranchId ? { id: parsedBranchId } : {},
      select: { id: true, name: true, city: true }
    });

    // 1. Fetch Invoices
    if (includes.includes("invoices")) {
      backupData.invoices = await prisma.invoice.findMany({
        where: parsedBranchId ? { branchId: parsedBranchId } : {},
        orderBy: { createdAt: "desc" },
        take: 5000
      });
    }

    // 2. Fetch Payments
    if (includes.includes("payments")) {
      backupData.payments = await prisma.invoicePayment.findMany({
        where: parsedBranchId ? { invoice: { branchId: parsedBranchId } } : {},
        orderBy: { paidAt: "desc" },
        take: 5000
      });
    }

    // 3. Fetch Customers
    if (includes.includes("customers")) {
      backupData.customers = await prisma.customer.findMany({
        orderBy: { name: "asc" },
        take: 5000
      });
    }

    // 4. Fetch Stock Items
    if (includes.includes("stock")) {
      backupData.stock = await prisma.productItem.findMany({
        where: parsedBranchId ? { branchId: parsedBranchId } : {},
        orderBy: { createdAt: "desc" },
        take: 5000
      });
    }

    // 5. Fetch Inventory Ledger
    if (includes.includes("stockLedger")) {
      backupData.stockLedger = await prisma.inventoryLedger.findMany({
        where: parsedBranchId ? { branchId: parsedBranchId } : {},
        orderBy: { createdAt: "desc" },
        take: 5000
      });
    }

    // 6. Fetch Karigar Jobs
    if (includes.includes("karigar")) {
      backupData.karigar = await prisma.karigarJob.findMany({
        where: parsedBranchId ? { branchId: parsedBranchId } : {},
        orderBy: { createdAt: "desc" },
        take: 2000
      });
    }

    // Compute record counts summary
    const recordCounts: Record<string, number> = {
      branches: backupData.branches?.length || 0,
      invoices: backupData.invoices?.length || 0,
      payments: backupData.payments?.length || 0,
      customers: backupData.customers?.length || 0,
      stock: backupData.stock?.length || 0,
      stockLedger: backupData.stockLedger?.length || 0,
      karigar: backupData.karigar?.length || 0,
    };

    const timestamp = new Date().toISOString();
    const payloadStr = JSON.stringify(backupData);
    const checksum = crypto.createHash("sha256").update(payloadStr).digest("hex");

    const fullBackupPayload = {
      metadata: {
        version: "1.0",
        generator: "JewelryStoreERP_GoogleDriveBackup",
        timestamp,
        branchScope,
        branchId: parsedBranchId,
        gdriveFolderId: targetFolderId,
        createdById,
        createdByName: session?.user?.name || "System Admin",
        checksum,
        recordCounts,
        includes
      },
      data: backupData
    };

    const jsonBuffer = Buffer.from(JSON.stringify(fullBackupPayload, null, 2));
    const sizeBytes = jsonBuffer.length;
    const fileId = `gdrive_bup_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const folderName = branchScope === "ALL" ? "All_Branches" : `Branch_${parsedBranchId}`;
    const filename = `Backup_${folderName}_${Date.now()}.json`;

    // A. Physically save backup file to local server disk (client/public/backups/)
    let localFileUrl = `/backups/${filename}`;
    try {
      const backupDir = path.join(process.cwd(), "public", "backups");
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const localFilePath = path.join(backupDir, filename);
      fs.writeFileSync(localFilePath, jsonBuffer);
      console.log("Physically saved local backup snapshot to disk:", localFilePath);
    } catch (fsErr) {
      console.warn("Could not save backup file to local public directory:", fsErr);
    }

    // B. Attempt direct Google Drive Upload if activeAccessToken provided
    let uploadedToGDrive = false;
    let driveFileUrl = localFileUrl;
    let uploadErrorMessage = null;

    if (activeAccessToken) {
      try {
        const metadata = {
          name: filename,
          mimeType: "application/json",
          parents: targetFolderId ? [targetFolderId] : []
        };

        const form = new FormData();
        form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
        form.append("file", new Blob([jsonBuffer], { type: "application/json" }));

        const gdriveRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${activeAccessToken}`
          },
          body: form
        });

        if (gdriveRes.ok) {
          const gdriveData = await gdriveRes.json();
          uploadedToGDrive = true;
          driveFileUrl = `https://drive.google.com/file/d/${gdriveData.id}/view?usp=sharing`;
          console.log("Successfully uploaded to Google Drive API:", gdriveData.id);
        } else {
          const errBody = await gdriveRes.text();
          uploadErrorMessage = `Google Drive API upload rejected (HTTP ${gdriveRes.status}): ${errBody}`;
          console.warn(uploadErrorMessage);
        }
      } catch (gdriveErr: any) {
        uploadErrorMessage = gdriveErr.message || "Failed to reach Google Drive API";
        console.warn("Google Drive API direct upload error:", gdriveErr);
      }
    }

    const baseIncludes = [
      ...includes,
      `META:GDRIVE_ID:${fileId}`,
      `META:GDRIVE_URL:${driveFileUrl}`,
      `META:SCOPE:${branchScope}`,
      `META:STATUS:${uploadedToGDrive ? "SUCCESS" : "LOCAL_ONLY"}`,
      `META:TYPE:BACKUP`,
      `META:COUNTS:${JSON.stringify(recordCounts)}`
    ];

    let backupLog: any;
    try {
      backupLog = await prisma.backupLog.create({
        data: {
          branchId: parsedBranchId || 0,
          format: "JSON_GDRIVE",
          sizeBytes,
          includes: baseIncludes,
          createdById,
          driveFileId: fileId,
          driveFileUrl,
          branchScope,
          status: uploadedToGDrive ? "SUCCESS" : "LOCAL_ONLY",
          recordCounts: recordCounts as any,
          type: "BACKUP"
        }
      });
    } catch (dbErr) {
      backupLog = await prisma.backupLog.create({
        data: {
          branchId: parsedBranchId || 0,
          format: "JSON_GDRIVE",
          sizeBytes,
          includes: baseIncludes,
          createdById
        }
      });
    }

    return NextResponse.json({
      success: true,
      uploadedToGDrive,
      message: uploadedToGDrive 
        ? `Backup successfully uploaded to Google Drive folder (${targetFolderId})` 
        : `Backup snapshot saved to local server disk. ${uploadErrorMessage ? `Google Drive note: Authorize Google Account to upload automatically.` : ""}`,
      backupLog: {
        ...backupLog,
        driveFileId: fileId,
        driveFileUrl,
        branchScope,
        recordCounts
      },
      payload: fullBackupPayload,
      localFileUrl,
      requiresAuth: !uploadedToGDrive && !activeAccessToken
    }, { status: 201 });

  } catch (error: any) {
    console.error("Google Drive Backup trigger failed:", error);
    return NextResponse.json({ error: error.message || "Failed to trigger Google Drive backup" }, { status: 500 });
  }
}
