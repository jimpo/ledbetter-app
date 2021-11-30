export interface LEDDriver {
	id: string,
	name: string,
	ipAddress: string,
}

export type DriverStatus = 'NotPlaying' | 'Playing' | 'Paused';

