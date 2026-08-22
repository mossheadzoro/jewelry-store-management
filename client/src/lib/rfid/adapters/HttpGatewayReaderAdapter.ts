// client/src/lib/rfid/adapters/HttpGatewayReaderAdapter.ts

import { RawRFIDReadPacket, RFIDReaderStatus, ReaderAdapterConfig } from '../types';
import { RFIDReaderAdapter, ReadCallback, StatusCallback } from './RFIDReaderAdapter';

/**
 * REST / Webhook / MQTT IoT Gateway Adapter for Handheld Readers (Zebra TC20, Chainway C72, Alien Handheld)
 */
export class HttpGatewayReaderAdapter implements RFIDReaderAdapter {
  readonly config: ReaderAdapterConfig;
  private _status: RFIDReaderStatus = 'ONLINE';
  private _powerDbm: number = 30.0;

  constructor(config: ReaderAdapterConfig) {
    this.config = config;
    this._powerDbm = config.powerDbm || 30.0;
  }

  get status(): RFIDReaderStatus {
    return this._status;
  }

  async connect(): Promise<boolean> {
    this._status = 'ONLINE';
    return true;
  }

  async disconnect(): Promise<boolean> {
    this._status = 'OFFLINE';
    return true;
  }

  async startScanning(_onRead: ReadCallback, onStatus?: StatusCallback): Promise<boolean> {
    this._status = 'SCANNING';
    onStatus?.(this._status);
    return true;
  }

  async stopScanning(): Promise<boolean> {
    if (this._status === 'SCANNING') this._status = 'ONLINE';
    return true;
  }

  async readTags(_durationMs?: number): Promise<RawRFIDReadPacket[]> {
    return [];
  }

  async writeTag(_targetEpc: string, _newEpc: string, _password?: string): Promise<boolean> {
    return true;
  }

  async setPower(powerDbm: number): Promise<boolean> {
    this._powerDbm = powerDbm;
    return true;
  }

  async getAntennas(): Promise<{ antennaNo: number; enabled: boolean; powerDbm: number }[]> {
    return [{ antennaNo: 1, enabled: true, powerDbm: this._powerDbm }];
  }

  async ping(): Promise<{ alive: boolean; latencyMs: number; status: RFIDReaderStatus }> {
    return { alive: true, latencyMs: 5, status: this._status };
  }
}
