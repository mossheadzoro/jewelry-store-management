// client/src/lib/rfid/services/deduplicationService.ts

import { prisma } from '@libs/prisma';
import { RawRFIDReadPacket, NormalizedRFIDObservation } from '../types';

interface BufferedRead {
  epc: string;
  readerId: string;
  antennaNo?: number;
  branchId: number;
  zoneId?: string;
  scanSessionId?: string;
  peakRssi: number;
  readCount: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
  frequency?: number;
  phase?: number;
}

class RFIDDeduplicationService {
  private buffer: Map<string, BufferedRead> = new Map();
  private flushTimer: NodeJS.Timeout | null = null;
  private deduplicationWindowMs: number = 2000;

  constructor() {
    // Periodic background flush every 1 second
    this.flushTimer = setInterval(() => {
      this.flushOldReads().catch((err) => {
        console.error('RFID Deduplication Flush Error:', err);
      });
    }, 1000);
  }

  /**
   * Process a single raw RFID read packet or batch of packets.
   */
  async processRead(packet: RawRFIDReadPacket, context: { branchId: number; zoneId?: string; scanSessionId?: string }): Promise<NormalizedRFIDObservation> {
    const key = `${packet.epc}:${context.scanSessionId || 'general'}:${packet.readerId}`;
    const now = packet.timestamp ? new Date(packet.timestamp) : new Date();
    const rssi = packet.rssi ?? -50.0;

    let entry = this.buffer.get(key);

    if (entry) {
      entry.readCount += 1;
      entry.lastSeenAt = now;
      if (rssi > entry.peakRssi) {
        entry.peakRssi = rssi;
      }
    } else {
      entry = {
        epc: packet.epc,
        readerId: packet.readerId,
        antennaNo: packet.antennaNo,
        branchId: context.branchId,
        zoneId: context.zoneId,
        scanSessionId: context.scanSessionId,
        peakRssi: rssi,
        readCount: 1,
        firstSeenAt: now,
        lastSeenAt: now,
        frequency: packet.frequency,
        phase: packet.phase,
      };
      this.buffer.set(key, entry);
    }

    return {
      epc: entry.epc,
      readerId: entry.readerId,
      antennaNo: entry.antennaNo,
      branchId: entry.branchId,
      zoneId: entry.zoneId,
      peakRssi: entry.peakRssi,
      readCount: entry.readCount,
      firstSeenAt: entry.firstSeenAt,
      lastSeenAt: entry.lastSeenAt,
    };
  }

  /**
   * Process an incoming batch of packets directly and flush immediately.
   */
  async processBatch(
    packets: RawRFIDReadPacket[],
    context: { branchId: number; zoneId?: string; scanSessionId?: string }
  ): Promise<NormalizedRFIDObservation[]> {
    const results: NormalizedRFIDObservation[] = [];
    for (const pkt of packets) {
      const normalized = await this.processRead(pkt, context);
      results.push(normalized);
    }
    await this.flushOldReads(true);
    return results;
  }

  /**
   * Flush buffered observations to database.
   */
  async flushOldReads(forceAll: boolean = false): Promise<void> {
    const now = Date.now();
    const toFlush: BufferedRead[] = [];

    for (const [key, entry] of this.buffer.entries()) {
      const ageMs = now - entry.lastSeenAt.getTime();
      if (forceAll || ageMs >= this.deduplicationWindowMs) {
        toFlush.push(entry);
        this.buffer.delete(key);
      }
    }

    if (toFlush.length === 0) return;

    // 1. Batch insert Raw Read Events
    try {
      await prisma.rFIDReadEvent.createMany({
        data: toFlush.map((entry) => ({
          epc: entry.epc,
          readerId: entry.readerId,
          branchId: entry.branchId,
          zoneId: entry.zoneId,
          scanSessionId: entry.scanSessionId,
          rssi: entry.peakRssi,
          readCount: entry.readCount,
          timestamp: entry.lastSeenAt,
          frequency: entry.frequency,
          phase: entry.phase,
          isDeduplicated: true,
        })),
        skipDuplicates: true,
      });
    } catch (e) {
      console.warn('Failed to batch insert read events:', e);
    }

    // 2. Update RFIDTag last seen timestamps and location
    for (const entry of toFlush) {
      try {
        await prisma.rFIDTag.updateMany({
          where: { epc: entry.epc },
          data: {
            lastSeenAt: entry.lastSeenAt,
            lastReaderId: entry.readerId,
            lastAntenna: entry.antennaNo,
            lastRssi: entry.peakRssi,
            currentZoneId: entry.zoneId,
          },
        });
      } catch (e) {
        // Tag may be unassigned or unknown in DB
      }
    }

    // 3. Upsert into RFIDObservation for active scan sessions
    for (const entry of toFlush) {
      if (!entry.scanSessionId) continue;
      try {
        // Lookup tag and productItem to check expected location
        const tag = await prisma.rFIDTag.findUnique({
          where: { epc: entry.epc },
          include: { productItem: true },
        });

        await prisma.rFIDObservation.upsert({
          where: {
            scanSessionId_epc: {
              scanSessionId: entry.scanSessionId,
              epc: entry.epc,
            },
          },
          create: {
            scanSessionId: entry.scanSessionId,
            epc: entry.epc,
            productItemId: tag?.productItemId || null,
            expectedBranchId: tag?.branchId || null,
            expectedZoneId: tag?.currentZoneId || null,
            detectedBranchId: entry.branchId,
            detectedZoneId: entry.zoneId || null,
            firstSeenAt: entry.firstSeenAt,
            lastSeenAt: entry.lastSeenAt,
            readCount: entry.readCount,
            peakRssi: entry.peakRssi,
            readerId: entry.readerId,
            confidenceScore: entry.readCount > 3 ? 1.0 : entry.readCount * 0.3,
          },
          update: {
            lastSeenAt: entry.lastSeenAt,
            readCount: { increment: entry.readCount },
            peakRssi: entry.peakRssi,
          },
        });
      } catch (e) {
        console.warn('Failed to upsert RFIDObservation:', e);
      }
    }
  }
}

export const rfidDeduplicationService = new RFIDDeduplicationService();
