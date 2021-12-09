<script lang="ts">
	import Animation from './Animation.svelte';
	import type {Layout, PixelLayout} from 'ledbetter-common';
	import {useFocus, Link, navigate} from 'svelte-navigator';
	import axios, {AxiosError} from "axios";
	import {DriverStatus, pixelLayout as layoutLib, program as programLib} from "ledbetter-common";
	import LayoutSelect from './LayoutSelect.svelte';
	import ControlButtons from "./ControlButtons.svelte";
	import {writable} from "svelte/store";
	import type {Writable} from "svelte/store";
	import {BrowserAnimationDriver} from "./driverControl";
	import type {DriverControl} from "./driverControl";
	import WasmDropZone from "./WasmDropZone.svelte";
	import {tick} from "svelte";
	const {API_VERSION_LATEST, validateWasmBinary} = programLib;

	const registerFocus = useFocus();

	let layout: Layout | null = null;
	let pixelLayout: PixelLayout | null;

	let creating = false;
	let name: string = '';
	let nameInput: HTMLInputElement;
	let bannerError: string | null = null;

	let wasmFileName: string | null = null;
	let programWasm: ArrayBuffer | null = null;

	let demoStatus: Writable<DriverStatus> = writable('NotPlaying');
	let driverControl: DriverControl;

	async function handleCreate() {
		if (programWasm === null) {
			return;
		}
		bannerError = null;

		if (/^\s*$/.test(name)) {
			nameInput.focus();
			return;
		}

		const formData = new FormData();
		formData.append('body', JSON.stringify({name, apiVersion: API_VERSION_LATEST}));
		formData.append('wasm', new Blob([programWasm], {type: 'application/wasm'}));

		creating = true;
		try {
			await axios.post('/api/programs', formData);
		} catch (untypedErr) {
			const err = untypedErr as AxiosError;
			if (err.response.status === 422 &&
				err.response.data instanceof Object &&
				err.response.data.hasOwnProperty('error'))
			{
				let {error: errMessage} = err.response.data as {error: string};
				bannerError = errMessage
			}
			creating = false;
			return;
		}

		navigate('/');
	}

	async function handleWasmFile(file: File | undefined) {
		bannerError = '';
		if (!file) {
			wasmFileName = null;
			return;
		}

		console.log(file);
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

	$: pixelLayout = layout ? layoutLib.parseCode(layout.sourceCode) : null;
	$: driverControl = new BrowserAnimationDriver(layout, programWasm, demoStatus);
</script>

<style>
	.action-buttons {
		float: right;
	}
</style>

<div class="container">
	<div class="action-buttons">
		<button
			class="button is-primary is-outlined is-small"
			class:is-loading={creating}
			title="Create"
			disabled={programWasm === null}
			on:click|preventDefault={handleCreate}
		>
			<span class="icon">
				<i class="fas fa-check"></i>
			</span>
		</button>
	</div>

	<nav class="breadcrumb is-medium" aria-label="breadcrumbs">
		<ul>
			<li><Link to="/">LEDBetter Lights</Link></li>
			<li class="is-active"><Link to="">Programs</Link></li>
			<li class="is-active"><Link to="" aria-current="page">New</Link></li>
		</ul>
	</nav>

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
			disabled={creating}
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
						on:input={(event) => handleWasmFile(event.target.files[0])}
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
</div>
