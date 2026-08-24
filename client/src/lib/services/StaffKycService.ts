import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { encryptBuffer, decryptBuffer } from "./KycEncryption";

export interface StaffDocumentMetadata {
  id: string;
  userId: number;
  documentType:
    | "AADHAR"
    | "PAN"
    | "PASSPORT"
    | "DRIVING_LICENSE"
    | "DEGREE_CERTIFICATE"
    | "BANK_PROOF"
    | "POLICE_VERIFICATION"
    | "OTHER";
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  iv: string;
  uploadedAt: string;
  uploadedById?: number;
  uploadedByName?: string;
  uploadedByRole?: string;
  notes?: string;
  verified: boolean;
  verifiedAt?: string;
  verifiedById?: number;
  verifiedByName?: string;
  rejectionReason?: string;
}

export type StaffKycStatus = "VERIFIED" | "PENDING_REVIEW" | "INCOMPLETE" | "REJECTED";

const BASE_STAFF_UPLOAD_DIR = path.join(process.cwd(), "secure-uploads", "staff");

async function ensureDir(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

function getStaffDir(userId: number) {
  return path.join(BASE_STAFF_UPLOAD_DIR, String(userId));
}

function getStaffRegistryPath(userId: number) {
  return path.join(getStaffDir(userId), "documents.json");
}

export class StaffKycService {
  /**
   * Retrieves all KYC documents for a given staff user and computes overall KYC status
   */
  static async getStaffDocuments(userId: number): Promise<{
    documents: StaffDocumentMetadata[];
    kycStatus: StaffKycStatus;
    hasPan: boolean;
    hasAadhar: boolean;
  }> {
    const registryPath = getStaffRegistryPath(userId);
    let documents: StaffDocumentMetadata[] = [];
    try {
      const data = await fs.readFile(registryPath, "utf-8");
      documents = JSON.parse(data);
    } catch {
      documents = [];
    }

    const hasVerified = documents.some((d) => d.verified);
    const hasPending = documents.some((d) => !d.verified && !d.rejectionReason);
    const hasRejected = documents.some((d) => !!d.rejectionReason && !d.verified);

    const hasPan = documents.some((d) => d.documentType === "PAN" && d.verified);
    const hasAadhar = documents.some((d) => d.documentType === "AADHAR" && d.verified);

    let kycStatus: StaffKycStatus = "INCOMPLETE";
    if (documents.length === 0) {
      kycStatus = "INCOMPLETE";
    } else if (hasVerified && !hasPending) {
      kycStatus = "VERIFIED";
    } else if (hasPending) {
      kycStatus = "PENDING_REVIEW";
    } else if (hasRejected) {
      kycStatus = "REJECTED";
    }

    return { documents, kycStatus, hasPan, hasAadhar };
  }

  /**
   * Encrypts and saves a staff document
   */
  static async saveStaffDocument(
    userId: number,
    fileBuffer: Buffer,
    meta: {
      documentType: string;
      originalName: string;
      mimeType: string;
      notes?: string;
      uploadedById?: number;
      uploadedByName?: string;
      uploadedByRole?: string;
    }
  ): Promise<StaffDocumentMetadata> {
    const staffDir = getStaffDir(userId);
    await ensureDir(staffDir);

    const docId = `staff_doc_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const { encrypted, iv } = encryptBuffer(fileBuffer);

    const filePath = path.join(staffDir, `${docId}.enc`);
    await fs.writeFile(filePath, encrypted);

    const newDoc: StaffDocumentMetadata = {
      id: docId,
      userId,
      documentType: (meta.documentType as any) || "OTHER",
      fileName: meta.originalName,
      originalName: meta.originalName,
      mimeType: meta.mimeType,
      fileSize: fileBuffer.length,
      iv,
      uploadedAt: new Date().toISOString(),
      uploadedById: meta.uploadedById,
      uploadedByName: meta.uploadedByName,
      uploadedByRole: meta.uploadedByRole,
      notes: meta.notes || "",
      verified: false,
    };

    const { documents } = await this.getStaffDocuments(userId);
    // Replace if same document type exists or append
    const updatedDocs = [...documents.filter((d) => d.id !== docId), newDoc];

    await fs.writeFile(getStaffRegistryPath(userId), JSON.stringify(updatedDocs, null, 2), "utf-8");
    return newDoc;
  }

  /**
   * Verifies or rejects a staff document
   */
  static async verifyStaffDocument(
    userId: number,
    docId: string,
    action: "VERIFY" | "REJECT",
    verifier: { id: number; name: string; role: string },
    notes?: string
  ): Promise<StaffDocumentMetadata | null> {
    const { documents } = await this.getStaffDocuments(userId);
    const docIndex = documents.findIndex((d) => d.id === docId);
    if (docIndex === -1) return null;

    const doc = documents[docIndex];
    if (action === "VERIFY") {
      doc.verified = true;
      doc.verifiedAt = new Date().toISOString();
      doc.verifiedById = verifier.id;
      doc.verifiedByName = verifier.name;
      doc.rejectionReason = undefined;
      if (notes) doc.notes = notes;
    } else {
      doc.verified = false;
      doc.verifiedAt = undefined;
      doc.rejectionReason = notes || "Rejected by reviewer";
    }

    documents[docIndex] = doc;
    await fs.writeFile(getStaffRegistryPath(userId), JSON.stringify(documents, null, 2), "utf-8");
    return doc;
  }

  /**
   * Deletes a staff document
   */
  static async deleteStaffDocument(userId: number, docId: string): Promise<boolean> {
    const { documents } = await this.getStaffDocuments(userId);
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return false;

    const filePath = path.join(getStaffDir(userId), `${docId}.enc`);
    try {
      await fs.unlink(filePath);
    } catch (e) {
      console.warn("Could not delete encrypted file:", filePath, e);
    }

    const updated = documents.filter((d) => d.id !== docId);
    await fs.writeFile(getStaffRegistryPath(userId), JSON.stringify(updated, null, 2), "utf-8");
    return true;
  }

  /**
   * Decrypts and retrieves raw file buffer for downloading
   */
  static async getStaffDocumentBuffer(
    userId: number,
    docId: string
  ): Promise<{ buffer: Buffer; meta: StaffDocumentMetadata } | null> {
    const { documents } = await this.getStaffDocuments(userId);
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return null;

    const filePath = path.join(getStaffDir(userId), `${docId}.enc`);
    const encrypted = await fs.readFile(filePath);
    const buffer = decryptBuffer(encrypted, doc.iv);
    return { buffer, meta: doc };
  }
}
