<script lang="ts">
	import axios from 'axios';
	import {
		pixelLayout as layoutLib, Layout, PixelLayout, ProgramBrief, LEDDriver, DriverStatus,
		program as programLib,
	} from 'ledbetter-common';
	import {useFocus} from 'svelte-navigator';
	import type {NavigatorLocation} from 'svelte-navigator';
	import Animation from '../components/Animation.svelte';
	import BLEDriverSelect from '../components/BLEDriverSelect.svelte';
	import LayoutSelect from '../components/LayoutSelect.svelte';
	import ProgramSelect from '../components/ProgramSelect.svelte';
	import ControlButtons from "../components/ControlButtons.svelte";
	import type {Writable} from "svelte/store";
	import {writable} from "svelte/store";
	import type {DeviceDriver} from "../driverControl";
	import {connectBluetoothDevice, DriverControl} from "../driverControl";
	import {BluetoothDriver, BrowserAnimationDriver} from "../driverControl";
	import WasmDropZone from "../components/WasmDropZone.svelte";
	const {API_VERSION_LATEST, validateWasmBinary} = programLib;

	const registerFocus = useFocus();

	export let location: NavigatorLocation<{
		programBrief?: ProgramBrief | null,
		programWasm?: ArrayBuffer | null,
		layout?: Layout | null,
	}>;

	let programBrief: ProgramBrief | null = location.state?.programBrief || null;
	let programWasm: ArrayBuffer | null = location.state?.programWasm || null;
	let layout: Layout | null = location.state?.layout || null;

	let selectedDevice: BluetoothDevice | null = null;

	let pixelLayout: PixelLayout | null;
	let driverStatus: Writable<DriverStatus> = writable('NotPlaying');
	let driver: DeviceDriver = new BrowserAnimationDriver(driverStatus, layout);
	let bannerError: string | null;

	async function handleWasmFile(file: File | undefined) {
		bannerError = '';
		if (!file) {
			return;
		}

		if (file.type !== 'application/wasm') {
			bannerError = 'File must be a WebAssembly binary';
			return;
		}
		let wasm = await file.arrayBuffer();
		try {
			await validateWasmBinary(wasm, API_VERSION_LATEST);
		} catch (err) {
			if (err instanceof Error) {
				bannerError = `Module is not valid: ${err.message}`;
				return;
			}
			throw err;
		}
		await selectNewProgram(wasm);
	}

	async function selectNewProgram(wasm: ArrayBuffer | null) {
		await driver.stop();
		programWasm = wasm;
		if (driver.canPlay) {
			await driver.play(wasm);
		}
	}

	async function fetchProgramWasm(programBrief: ProgramBrief | null) {
		if (programBrief) {
			const response = await axios.get(
				`/api/programs/${programBrief.id}/main.wasm`,
				{responseType: 'arraybuffer'},
			);
			await selectNewProgram(response.data);
		} else {
			await selectNewProgram(null);
		}
	}

	$: pixelLayout = layout && layoutLib.parseCode(layout.sourceCode);
	$: (async () => {
		if (selectedDevice === null) {
			if (!(driver instanceof BrowserAnimationDriver && driver.layout === layout)) {
				await driver.disconnect();
				driver = new BrowserAnimationDriver(layout, driverStatus);
			}
		} else {
			if (!(driver instanceof BluetoothDriver && driver.device.id === selectedDevice.id)) {
				await driver.disconnect();
				driver = await connectBluetoothDevice(selectedDevice, driverStatus);
			}
		}
	})();
</script>

<div class="container">
	{#if bannerError}
		<div class="notification is-danger">
			<button class="delete" on:click|preventDefault={() => bannerError = null}></button>
			{bannerError}
		</div>
	{/if}

	<div class="block">
		<h1  use:registerFocus class="title">LEDBetter Lights</h1>
	</div>

	<div class="block">
		<WasmDropZone on:wasmDrop={({detail: file}) => handleWasmFile(file)}>
			<Animation
				aspectRatio={1}
				layout={pixelLayout}
				{programWasm}
				status={driver instanceof BrowserAnimationDriver ? $driverStatus : 'NotPlaying'}
			/>
		</WasmDropZone>
	</div>
	<div class="block">
		<div class="columns">
			<div class="column">
				<BLEDriverSelect
					bind:device={selectedDevice}
				/>
			</div>
			<div class="column">
				<LayoutSelect bind:layout={layout} />
			</div>
			<div class="column">
				<ProgramSelect
					bind:program={programBrief}
					{layout}
					{programWasm}
					on:select={({detail: selected}) => fetchProgramWasm(selected)}
				/>
			</div>
			<div class="column">
				<ControlButtons driver={new DriverControl(driver, $driverStatus, programWasm)}/>
			</div>
		</div>
	</div>
</div>
