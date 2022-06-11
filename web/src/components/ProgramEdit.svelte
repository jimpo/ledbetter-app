<script lang="ts">
	import Animation from './Animation.svelte';
	import ControlButtons from './ControlButtons.svelte';
	import LayoutSelect from './LayoutSelect.svelte';
	import WasmDropZone from "./WasmDropZone.svelte";
	import ErrorBanner from "./ErrorBanner.svelte";

	import {BrowserAnimationDriver, DriverControl} from "../driverControl";
	import type {DeviceDriver} from "../driverControl";
	import {useFocus} from "svelte-navigator";
	import {DriverStatus, Layout, PixelLayout, pixelLayout as layoutLib, program as programLib} from "ledbetter-common";
	import {writable} from 'svelte/store';
	import type {Writable} from 'svelte/store';
	const {API_VERSION_LATEST, validateWasmBinary} = programLib;

	const registerFocus = useFocus();

	export let name: string;
	export let apiVersion: number;
	export let programWasm: ArrayBuffer | null;

	export let saving: boolean;
	export let bannerError: string | null;

	let nameInput: HTMLInputElement;

	let driver: DeviceDriver;
	let driverStatus: Writable<DriverStatus> = writable('NotPlaying');

	let wasmFileName: string | null = null;

	export let layout: Layout | null = null;
	let pixelLayout: PixelLayout | null;

	export function focusNameInput() {
		nameInput.focus();
	}

	async function handleWasmFile(file: File | undefined) {
		bannerError = '';
		wasmFileName = null;
		programWasm = null;
		if (!file) {
			return;
		}

		if (file.type !== 'application/wasm') {
			bannerError = 'File must be a WebAssembly binary';
			return;
		}

		apiVersion = API_VERSION_LATEST;
		let wasm = await file.arrayBuffer();
		try {
			await validateWasmBinary(wasm, apiVersion);
		} catch (err) {
			if (err instanceof Error) {
				bannerError = `Module is not valid: ${err.message}`;
				wasmFileName = null;
				return;
			}
			throw err;
		}
		wasmFileName = file.name;
		await handleNewWasm(wasm);
	}

	async function handleNewWasm(wasm: ArrayBuffer) {
		await driver.stop();
		programWasm = wasm;
		if (driver.canPlay) {
			await driver.play(programWasm);
		}
	}

	async function handleWasmEvent(event: Event) {
		if ('files' in event.target) {
			const files = event.target['files'];
			if (files instanceof FileList) {
				await handleWasmFile(files[0]);
			}
		}
	}

	$: pixelLayout = layout ? layoutLib.parseCode(layout.sourceCode) : null;
	$: driver = new BrowserAnimationDriver(layout, driverStatus);
	$: {
		if (!wasmFileName && programWasm) {
			wasmFileName = 'main.wasm';
		} else if (programWasm === null) {
			wasmFileName = null;
		}
	}
</script>

<ErrorBanner bind:errorMessage={bannerError} />

<div class="block">
	<input
		bind:this={nameInput}
		bind:value={name}
		use:registerFocus
		disabled={saving}
		class="input is-large"
		type="text"
		placeholder="Program name..."
	/>
</div>

<div class="block">
	<WasmDropZone on:wasmDrop={({detail: wasmFile}) => handleWasmFile(wasmFile)}>
		<Animation aspectRatio={1} layout={pixelLayout} {programWasm} status={$driverStatus} />
	</WasmDropZone>
</div>

<div class="block columns">
	<div class="column is-one-quarter">
		<LayoutSelect bind:layout={layout} />
	</div>
	<div class="column is-one-quarter">
		<div class="file has-name is-fullwidth">
			<label class="file-label">
				<input
					class="file-input"
					type="file"
					name="programWasm"
					on:input={(event) => handleWasmEvent(event)}
				>
				<span class="file-cta">
      			<span class="file-icon">
        			<i class="fas fa-upload"></i>
      			</span>
      			<span class="file-label">Program Wasm…</span>
    			</span>
				<span class="file-name">{wasmFileName || ''}</span>
			</label>
		</div>
	</div>
	<div class="column">
		<ControlButtons driver={new DriverControl(driver, $driverStatus, programWasm)}/>
	</div>
</div>