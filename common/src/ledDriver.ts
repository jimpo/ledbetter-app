export interface LEDDriver {
	id: string,
	name: string,
	ipAddress: string,
	status?: DriverStatus,
}

export type DriverStatus = 'NotPlaying' | 'Playing' | 'Paused' | 'Transfer';

