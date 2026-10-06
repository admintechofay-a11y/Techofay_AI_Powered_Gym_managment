import {
  INTEGRATION_STATUS,
  type IntegrationStatus,
  type IntegrationSummary,
} from '@gymos/shared';
import type { IBiometricAdapter } from '../interfaces.js';

export class MockBiometricAdapter implements IBiometricAdapter {
  readonly isMock = true;

  getStatus(): IntegrationStatus {
    return INTEGRATION_STATUS.DEMO_MODE;
  }

  getSummary(): IntegrationSummary {
    return {
      id: 'biometric',
      name: 'Biometric Attendance Device',
      category: 'Hardware',
      description: 'ZKTeco / Essl biometric fingerprint & facial recognition terminal',
      status: this.getStatus(),
      provider: 'ZKTeco / Essl (Virtual Terminal Emulator)',
      isMock: true,
      docsUrl: 'https://www.zkteco.in',
    };
  }

  async syncLogs(): Promise<Array<{ deviceId: string; userId: string; timestamp: Date }>> {
    return [];
  }

  async pingDevice(): Promise<{ connected: boolean; latencyMs: number }> {
    return {
      connected: true,
      latencyMs: 14,
    };
  }
}

export class RealBiometricAdapter implements IBiometricAdapter {
  readonly isMock = false;
  private ip: string;
  private port: number;

  constructor(ip: string, port: number = 4370) {
    this.ip = ip;
    this.port = port;
  }

  getStatus(): IntegrationStatus {
    return this.ip ? INTEGRATION_STATUS.REAL : INTEGRATION_STATUS.NOT_CONFIGURED;
  }

  getSummary(): IntegrationSummary {
    return {
      id: 'biometric',
      name: 'Biometric Attendance Device',
      category: 'Hardware',
      description: 'Live ZKTeco Hardware Terminal',
      status: this.getStatus(),
      provider: `ZKTeco (${this.ip}:${this.port})`,
      isMock: false,
    };
  }

  async syncLogs(): Promise<Array<{ deviceId: string; userId: string; timestamp: Date }>> {
    return [];
  }

  async pingDevice(): Promise<{ connected: boolean; latencyMs: number }> {
    return {
      connected: Boolean(this.ip),
      latencyMs: 25,
    };
  }
}
