// client/src/lib/rfid/services/readerManager.ts

import { prisma } from '@libs/prisma';
import { RFIDReaderAdapter } from '../adapters/RFIDReaderAdapter';
import { MockRFIDReaderAdapter } from '../adapters/MockRFIDReaderAdapter';
import { GenericTcpReaderAdapter } from '../adapters/GenericTcpReaderAdapter';
import { HttpGatewayReaderAdapter } from '../adapters/HttpGatewayReaderAdapter';
import { ReaderAdapterConfig, RFIDReaderStatus } from '../types';

class RFIDReaderManager {
  private adapters: Map<string, RFIDReaderAdapter> = new Map();

  /**
   * Get or instantiate an adapter for a given reader ID.
   */
  async getAdapter(readerId: string): Promise<RFIDReaderAdapter> {
    if (this.adapters.has(readerId)) {
      return this.adapters.get(readerId)!;
    }

    const reader = await prisma.rFIDReader.findUnique({
      where: { id: readerId },
      include: { branch: true, zone: true },
    });

    if (!reader) {
      throw new Error(`RFID Reader ${readerId} not found`);
    }

    const config: ReaderAdapterConfig = {
      readerId: reader.id,
      name: reader.name,
      ipAddress: reader.ipAddress,
      port: reader.port,
      connectionType: reader.connectionType as any,
      powerDbm: reader.powerDbm,
      branchId: reader.branchId,
      zoneId: reader.zoneId,
      isMock: reader.isMock,
      metadata: reader.metadata as any,
    };

    let adapter: RFIDReaderAdapter;

    if (reader.isMock || reader.connectionType === 'MOCK_SIMULATOR') {
      adapter = new MockRFIDReaderAdapter(config);
      // Pre-seed mock pool with real active tags from branch
      const activeTags = await prisma.rFIDTag.findMany({
        where: { branchId: reader.branchId },
        take: 50,
        select: { epc: true },
      });
      if (activeTags.length > 0) {
        (adapter as MockRFIDReaderAdapter).setMockEpcPool(activeTags.map((t) => t.epc));
      }
    } else if (reader.connectionType === 'HTTP_REST' || reader.connectionType === 'WEBSOCKET') {
      adapter = new HttpGatewayReaderAdapter(config);
    } else {
      adapter = new GenericTcpReaderAdapter(config);
    }

    this.adapters.set(readerId, adapter);
    return adapter;
  }

  /**
   * Ping reader and update its heartbeat and status in database.
   */
  async pingReader(readerId: string): Promise<{ alive: boolean; latencyMs: number; status: RFIDReaderStatus }> {
    const adapter = await this.getAdapter(readerId);
    const result = await adapter.ping();

    await prisma.rFIDReader.update({
      where: { id: readerId },
      data: {
        lastHeartbeat: new Date(),
        status: result.status,
      },
    });

    return result;
  }

  /**
   * Set power level on reader and persist to database.
   */
  async setReaderPower(readerId: string, powerDbm: number): Promise<boolean> {
    const adapter = await this.getAdapter(readerId);
    const ok = await adapter.setPower(powerDbm);
    if (ok) {
      await prisma.rFIDReader.update({
        where: { id: readerId },
        data: { powerDbm },
      });
    }
    return ok;
  }

  /**
   * Remove cached adapter on deletion or reconfiguration.
   */
  async evictAdapter(readerId: string): Promise<void> {
    if (this.adapters.has(readerId)) {
      const adapter = this.adapters.get(readerId)!;
      await adapter.disconnect().catch(() => {});
      this.adapters.delete(readerId);
    }
  }
}

export const rfidReaderManager = new RFIDReaderManager();
