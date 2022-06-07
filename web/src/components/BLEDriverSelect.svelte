<script lang="ts">
	import {createEventDispatcher} from "svelte";

	const dispatch = createEventDispatcher();

	export let device: BluetoothDevice | null = null;

	let defaultLabel: string = 'Browser demo';
	let dropdownElement: HTMLDivElement;
	let isActive: boolean = false;

	const ECHO_SERVICE_UUID = '00000000-0000-0000-000f-eedc0de00002';
	const ECHO_CHARACTERISTIC_UUID = '00000000-0000-0000-000f-00dc0de00002';

	// function onSelect(option: Option | null) {
	// 	const newSelected = (option.value && drivers.get(option.value)) || null;
	// 	dispatch('select', newSelected);
	// 	selected = newSelected;
	// }

	function onFocusOut(event: FocusEvent) {
		const nowFocused = event.relatedTarget;
		if (!((nowFocused instanceof Node) && dropdownElement.contains(nowFocused)))	{
			isActive = false;
		}
	}

	async function scanDrivers(): Promise<void> {
		const newDevice = await navigator.bluetooth.requestDevice({
			filters: [{services: [ECHO_SERVICE_UUID]}],
		});
		await newDevice.gatt.connect();
		device = newDevice;
		// try {
		//
		// } catch (err) {
		// 	device = null;
		// 	throw err;
		// }

		<!--const service = await gatt.getPrimaryService(ECHO_SERVICE_UUID);-->
		<!--const characteristic = await service.getCharacteristic(ECHO_CHARACTERISTIC_UUID);-->

		<!--let resolve = (_) => {};-->
		<!--characteristic.oncharacteristicvaluechanged = (event) => {-->
		<!--	console.log('received', event);-->
		<!--	resolve(event);-->
		<!--};-->
		<!--await characteristic.startNotifications();-->
		<!--for (let i = 0; i < 100; i++) {-->
		<!--	const receivePromise = new Promise((resolve_) => resolve = resolve_);-->
		<!--	const buffer = new ArrayBuffer(512);-->
		// 	console.log('writing');
		// 	await characteristic.writeValueWithoutResponse(buffer);
		// 	await receivePromise;
		// }
	}
</script>

<style>
	.dropdown.is-fullwidth {
		display: flex;
	}

	.dropdown.is-fullwidth .dropdown-trigger, .dropdown.is-fullwidth .dropdown-menu {
		width: 100%;
	}
</style>

<div
	class="dropdown is-fullwidth"
	class:is-active={isActive}
	bind:this={dropdownElement}
	on:focusout={onFocusOut}
>
	<div class="dropdown-trigger">
		<button
			class="button is-fullwidth"
			aria-haspopup="true"
			aria-controls="dropdown-menu"
			on:click={() => isActive = !isActive}
		>
			<span>{device !== null ? device.name : defaultLabel}</span>
			<span class="icon is-small">
        <i class="fas fa-angle-down" aria-hidden="true"></i>
      </span>
		</button>
	</div>
	<div class="dropdown-menu" role="menu">
		<div class="dropdown-content">
			<a
				class="dropdown-item"
				href={'#'}
				on:click|preventDefault={scanDrivers}
			>
				Connect to driver
			</a>
		</div>
	</div>
</div>
