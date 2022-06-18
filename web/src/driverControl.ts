/** Logic for sending run, play, pause, stop, etc. commands to drivers */

import type {Unsubscriber, Writable} from 'svelte/store';
import type {DriverStatus, Layout} from 'ledbetter-common';

export const LEDBETTER_SERVICE_UUID = '62ffccb9-226c-4952-fb1d-550612430000';
const LEDBETTER_STATUS_CHARACTERISTIC_UUID = '62ffccb9-226c-4952-fb1d-550612430001';
const LEDBETTER_TX_CHARACTERISTIC_UUID = '62ffccb9-226c-4952-fb1d-550612430002';

const LEDBETTER_STATUS_NOTPLAYING = 0;
const LEDBETTER_STATUS_PLAYING = 1;
const LEDBETTER_STATUS_PAUSED = 2;
const LEDBETTER_STATUS_TRANSFER = 3;

export class DriverControl {
	readonly canPlay: boolean;

	constructor(
		private device: DeviceDriver,
		public status: DriverStatus,
		private programWasm: BufferSource | null,
	) {
		this.canPlay = device.canPlay && (status === 'Paused' || programWasm !== null);
	}

	async play(): Promise<void> {
		if (this.status === 'Paused') {
			await this.device.unpause();
		} else {
			await this.device.play(this.programWasm);
		}
	}

	async pause(): Promise<void> {
		await this.device.pause();
	}

	async stop(): Promise<void> {
		await this.device.stop();
	}
}

export interface DeviceDriver {
	readonly canPlay: boolean;

	play(programWasm: BufferSource): Promise<void>;
	unpause(): Promise<void>;
	pause(): Promise<void>;
	stop(): Promise<void>;

	disconnect(): Promise<void>;
}

export class BrowserAnimationDriver {
	private _canPlay: boolean;

	constructor(
		public layout: Layout | null,
		private statusStore: Writable<DriverStatus>,
	) {
		this._canPlay = layout !== null;
	}

	get canPlay(): boolean {
		return this._canPlay;
	}

	async play(_programWasm: BufferSource): Promise<void> {
		if (this.canPlay) {
			this.statusStore.set('Playing');
		}
	}

	async unpause(): Promise<void> {
		this.statusStore.set('Playing');
	}

	async pause(): Promise<void> {
		this.statusStore.set('Paused');
	}

	async stop(): Promise<void> {
		this.statusStore.set('NotPlaying');
	}

	async disconnect(): Promise<void> {
		this._canPlay = false;
	}
}

export class BluetoothDriver {
	private _canPlay: boolean;
	private readonly _listeners: Unsubscriber[];

	constructor(
		public device: BluetoothDevice,
		private statusStore: Writable<DriverStatus>,
	) {
		this._canPlay = true;
		this._listeners = [];
	}

	get canPlay(): boolean {
		return this._canPlay;
	}

	async play(programWasm: BufferSource): Promise<void> {
		const service = await this._getService();
		const statusChar = await this._getStatusCharacteristic(service);

		await statusChar.writeValueWithoutResponse(new Uint8Array([LEDBETTER_STATUS_TRANSFER]).buffer);
		await this._awaitStatusChangeTo('Transfer');

		const txChar = await this._getTxCharacteristic(service);
		const programBuffer = programWasm instanceof ArrayBuffer ? programWasm : programWasm.buffer;
		const maxChunkSize = 510; // TODO: See if we can query the API for this

		for (let i = 0, offset = 0; offset < programWasm.byteLength; i++, offset += maxChunkSize - 2) {
			let chunk;
			if (offset < 2) {
				chunk = new Uint8Array(programBuffer.slice(offset, Math.min(offset + maxChunkSize, programBuffer.byteLength)));
				chunk.copyWithin(2, 0, chunk.length - 2);
			} else {
				chunk = new Uint8Array(programBuffer.slice(offset - 2, Math.min(offset + maxChunkSize - 2, programBuffer.byteLength)));
			}
			chunk[0] = i & 0xff;
			chunk[1] = (i >> 8) & 0xff;

			await txChar.writeValueWithoutResponse(chunk);
		}

		await this._awaitStatusChangeTo('Playing');
	}

	async unpause(): Promise<void> {
		const service = await this._getService();
		const characteristic = await this._getStatusCharacteristic(service);
		await characteristic.writeValueWithoutResponse(new Uint8Array([LEDBETTER_STATUS_PLAYING]).buffer);
	}

	async pause(): Promise<void> {
		const service = await this._getService();
		const characteristic = await this._getStatusCharacteristic(service);
		await characteristic.writeValueWithoutResponse(new Uint8Array([LEDBETTER_STATUS_PAUSED]).buffer);
	}

	async stop(): Promise<void> {
		const service = await this._getService();
		const characteristic = await this._getStatusCharacteristic(service);
		await characteristic.writeValueWithoutResponse(new Uint8Array([LEDBETTER_STATUS_NOTPLAYING]).buffer);
	}

	async disconnect(): Promise<void> {
		this._canPlay = false;
		const service = await this._getService();
		const characteristic = await this._getStatusCharacteristic(service);

		await characteristic.stopNotifications();
		this.device.gatt.disconnect();

		for (const unsubscribe of this._listeners) {
			unsubscribe();
		}
	}

	updateStatusValue(value: DataView) {
		if (value.byteLength !== 1) {
			console.error(`Unknown BLE device status value length: ${value.byteLength}`);
			this.statusStore.set('NotPlaying');
			return;
		}

		const statusValue = value.getInt8(0);
		switch (statusValue) {
			case LEDBETTER_STATUS_NOTPLAYING:
				this.statusStore.set('NotPlaying');
				break;
			case LEDBETTER_STATUS_PLAYING:
				this.statusStore.set('Playing');
				break;
			case LEDBETTER_STATUS_PAUSED:
				this.statusStore.set('Paused');
				break;
			case LEDBETTER_STATUS_TRANSFER:
				this.statusStore.set('Transfer');
				break;
			default:
				console.error(`Unknown BLE device status value: ${statusValue}`);
				this.statusStore.set('NotPlaying');
				break;
		}
	}

	_awaitStatusChangeTo(status: DriverStatus): Promise<void> {
		return new Promise((resolve, reject) => {
			let fulfilled = false;
			let unsubscribe: Unsubscriber;

			unsubscribe = this.statusStore.subscribe((newStatus) => {
				if (newStatus == status) {
					resolve();
					unsubscribe();
					fulfilled = true;
				}
			});

			this._listeners.push(() => {
				if (!fulfilled) {
					reject();
					unsubscribe();
					fulfilled = true;
				}
			});
		});
	}

	async _getService(): Promise<BluetoothRemoteGATTService> {
		return await this.device.gatt.getPrimaryService(LEDBETTER_SERVICE_UUID);
	}

	async _getStatusCharacteristic(service: BluetoothRemoteGATTService): Promise<BluetoothRemoteGATTCharacteristic> {
		return await service.getCharacteristic(LEDBETTER_STATUS_CHARACTERISTIC_UUID);
	}

	async _getTxCharacteristic(service: BluetoothRemoteGATTService): Promise<BluetoothRemoteGATTCharacteristic> {
		return await service.getCharacteristic(LEDBETTER_TX_CHARACTERISTIC_UUID);
	}
}

export async function connectBluetoothDevice(
	device: BluetoothDevice,
	statusStore: Writable<DriverStatus>,
): Promise<DeviceDriver> {
	const gatt = await device.gatt.connect();
	const service = await gatt.getPrimaryService(LEDBETTER_SERVICE_UUID);
	const statusChar = await service.getCharacteristic(LEDBETTER_STATUS_CHARACTERISTIC_UUID);

	const driver = new BluetoothDriver(device, statusStore);
	statusChar.oncharacteristicvaluechanged = function (_event) {
		driver.updateStatusValue(this.value);
	};
	await statusChar.startNotifications();

	console.log("read");
	const value = await statusChar.readValue()
	console.log("post read");
	driver.updateStatusValue(value);

	return driver;
}
