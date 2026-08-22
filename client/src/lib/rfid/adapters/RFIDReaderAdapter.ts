// client/src/lib/rfid/adapters/RFIDReaderAdapter.ts

import { RawRFIDReadPacket, RFIDReaderStatus, ReaderAdapterConfig } from '../types';

export type ReadCallback = (packet: RawRFIDReadPacket) => void;
export type StatusCallback = (status: RFIDReaderStatus, message?: string) => void;

/**
 * Hardware-Vendor Agnostic RFID Reader Adapter Interface.
 * Encapsulates all vendor-specific protocols (LLRP, Impinj Octane, Zebra RFID3, Chainway SDK, HTTP/MQTT).
 */
export interface RFIDReaderAdapter {
  readonly config: ReaderAdapterConfig;
  readonly status: RFIDReaderStatus;

  /**
   * Connect to the physical or simulated RFID reader.
   */
  connect(): Promise<boolean>;

  /**
   * Disconnect from reader and release hardware sockets/ports.
   */
  disconnect(): Promise<boolean>;

  /**
   * Start continuous or pulsed RF inventory scanning.
   */
  startScanning(onRead: ReadCallback, onStatus?: StatusCallback): Promise<boolean>;

  /**
   * Stop RF carrier and tag inventory scanning.
   */
  stopScanning(): Promise<boolean>;

  /**
   * Perform single-shot or timed tag read query.
   */
  readTags(durationMs?: number): Promise<RawRFIDReadPacket[]>;

  /**
   * Write new EPC or User Memory bank to an RFID tag placed in near field.
   */
  writeTag(targetEpc: string, newEpc: string, password?: string): Promise<boolean>;

  /**
   * Set RF output power in dBm (e.g. 10.0 dBm to 33.0 dBm).
   */
  setPower(powerDbm: number): Promise<boolean>;

  /**
   * Query antenna ports status and configurations.
   */
  getAntennas(): Promise<{ antennaNo: number; enabled: boolean; powerDbm: number }[]>;

  /**
   * Ping reader to check heartbeat and health.
   */
  ping(): Promise<{ alive: boolean; latencyMs: number; status: RFIDReaderStatus }>;
}
