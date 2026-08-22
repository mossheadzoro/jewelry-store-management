// client/src/lib/rfid/adapters/MockRFIDReaderAdapter.ts

import {
  RawRFIDReadPacket,
  RFIDReaderStatus,
  ReaderAdapterConfig,
} from '../types';
import { RFIDReaderAdapter, ReadCallback, StatusCallback } from './RFIDReaderAdapter';

export class MockRFIDReaderAdapter implements RFIDReaderAdapter {
  readonly config: ReaderAdapterConfig;
  private _status: RFIDReaderStatus = 'OFFLINE';
  private _intervalId: NodeJS.Timeout | null = null;
  private _powerDbm: number = 30.0;
  private _mockEpcPool: string[] = [];

  constructor(config: ReaderAdapterConfig) {
    this.config = config;
    this._powerDbm = config.powerDbm || 30.0;
  }

  get status(): RFIDReaderStatus {
    return this._status;
  }

  setMockEpcPool(epcs: string[]) {
    this._mockEpcPool = epcs;
  }

  async connect(): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    this._status = 'ONLINE';
    return true;
  }

  async disconnect(): Promise<boolean> {
    await this.stopScanning();
    this._status = 'OFFLINE';
    return true;
  }

  async startScanning(onRead: ReadCallback, onStatus?: StatusCallback): Promise<boolean> {
    if (this._status !== 'ONLINE' && this._status !== 'SCANNING') {
      await this.connect();
    }
    this._status = 'SCANNING';
    onStatus?.(this._status);

    if (this._intervalId) clearInterval(this._intervalId);

    // Default mock EPC pool if none provided
    const pool = this._mockEpcPool.length > 0
      ? this._mockEpcPool
      : [
          'E28068940000501234567890',
          'E28068940000501234567891',
          'E28068940000501234567892',
          'E28068940000501234567893',
          'E28068940000501234567894',
          'E28068940000501234567895',
          'E28068940000501234567899', // Unexpected
        ];

    // Emit batches of simulated reads every 400ms
    this._intervalId = setInterval(() => {
      if (this._status !== 'SCANNING') return;

      // Select 1 to 3 random tags from pool to simulate realistic RF pulse reads
      const burstCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < burstCount; i++) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        const epc = pool[randomIndex];
        const randomAntenna = Math.floor(Math.random() * 4) + 1;
        // Realistic RSSI variation based on configured power
        const rssi = -(Math.floor(Math.random() * 25) + 38) + (this._powerDbm - 30.0) * 0.5;

        onRead({
          epc,
          tid: `E2801105${epc.slice(-8)}`,
          readerId: this.config.readerId,
          antennaNo: randomAntenna,
          rssi: Number(rssi.toFixed(1)),
          frequency: 865.7 + Math.random() * 1.5,
          phase: Math.floor(Math.random() * 360),
          timestamp: new Date(),
        });
      }
    }, 400);

    return true;
  }

  async stopScanning(): Promise<boolean> {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
    if (this._status === 'SCANNING') {
      this._status = 'ONLINE';
    }
    return true;
  }

  async readTags(durationMs: number = 2000): Promise<RawRFIDReadPacket[]> {
    const packets: RawRFIDReadPacket[] = [];
    await this.startScanning((pkt) => packets.push(pkt));
    await new Promise((resolve) => setTimeout(resolve, durationMs));
    await this.stopScanning();
    return packets;
  }

  async writeTag(targetEpc: string, newEpc: string, _password?: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const idx = this._mockEpcPool.indexOf(targetEpc);
    if (idx !== -1) {
      this._mockEpcPool[idx] = newEpc;
    } else {
      this._mockEpcPool.push(newEpc);
    }
    return true;
  }

  async setPower(powerDbm: number): Promise<boolean> {
    this._powerDbm = Math.min(Math.max(powerDbm, 10.0), 33.0);
    return true;
  }

  async getAntennas(): Promise<{ antennaNo: number; enabled: boolean; powerDbm: number }[]> {
    return [
      { antennaNo: 1, enabled: true, powerDbm: this._powerDbm },
      { antennaNo: 2, enabled: true, powerDbm: this._powerDbm },
      { antennaNo: 3, enabled: true, powerDbm: this._powerDbm },
      { antennaNo: 4, enabled: true, powerDbm: this._powerDbm },
    ];
  }

  async ping(): Promise<{ alive: boolean; latencyMs: number; status: RFIDReaderStatus }> {
    const start = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 50));
    return {
      alive: this._status !== 'OFFLINE' && this._status !== 'ERROR',
      latencyMs: Date.now() - start,
      status: this._status,
    };
  }
}
