<script lang="ts">
	import Animation from './Animation.svelte';
	import ControlButtons from './ControlButtons.svelte';
	import LayoutSelect from './LayoutSelect.svelte';
	import WasmDropZone from "./WasmDropZone.svelte";

	import {BrowserAnimationDriver} from "./driverControl";
	import type {DriverControl} from "./driverControl";
	import {useFocus} from "svelte-navigator";
	import {DriverStatus, Layout, PixelLayout, pixelLayout as layoutLib, program as programLib} from "ledbetter-common";
	import {writable} from 'svelte/store';
	import type {Writable} from 'svelte/store';
	import {tick} from "svelte";
	const {API_VERSION_LATEST, validateWasmBinary} = programLib;

	const registerFocus = useFocus();

	export let name: string;
	export let apiVersion: number;
	export let programWasm: ArrayBuffer | null;

	export let saving: boolean;
	export let bannerError: string | null;

	let nameInput: HTMLInputElement;

	let demoStatus: Writable<DriverStatus> = writable('NotPlaying');
	let driverControl: DriverControl;

	let wasmFileName: string | null = null;

	export let layout: Layout | null = null;
	let pixelLayout: PixelLayout | null;

	export function focusNameInput() {
		nameInput.focus();
	}

	async function handleWasmFile(file: File | undefined) {
		bannerError = '';
		if (!file) {
			wasmFileName = null;
			return;
		}

		if (file.type !== 'application/wasm') {
			bannerError = 'File must be a WebAssembly binary';
			wasmFileName = null;
			return;
		}
		let wasm = await file.arrayBuffer();
		try {
			await validateWasmBinary(wasm, API_VERSION_LATEST);
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
		await driverControl.stop();
		programWasm = wasm;
		// Wait for driverControl to update
		await tick();
		await driverControl.play();
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
	$: driverControl = new BrowserAnimationDriver(layout, programWasm, demoStatus);
	$: {
		if (!wasmFileName && programWasm) {
			wasmFileName = 'main.wasm';
		} else if (programWasm === null) {
			wasmFileName = null;
		}
	}
</script>

{#if bannerError}
	<div class="notification is-danger">
		<button class="delete" on:click|preventDefault={() => bannerError = null}></button>
		{bannerError}
	</div>
{/if}

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
		<Animation aspectRatio={1} layout={pixelLayout} {programWasm} status={$demoStatus} />
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
		<ControlButtons status={$demoStatus} {driverControl} />
	</div>
</div>