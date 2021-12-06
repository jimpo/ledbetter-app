<script lang="ts">
	import axios from 'axios';
	import {
		pixelLayout as layoutLib, Layout, PixelLayout, ProgramBrief, LEDDriver, DriverStatus,
	} from 'ledbetter-common';
	import {useFocus} from 'svelte-navigator';
	import Animation from './Animation.svelte';
	import LayoutSelect from './LayoutSelect.svelte';
	import ProgramSelect from './ProgramSelect.svelte';
	import DriverSelect from './DriverSelect.svelte';
	import ControlButtons from "./ControlButtons.svelte";
	import type {Writable} from "svelte/store";
	import {writable} from "svelte/store";
	import type {DriverControl} from "./driverControl";
	import {BrowserAnimationDriver, ExternalDriver} from "./driverControl";
	import WasmDropZone from "./WasmDropZone.svelte";
	import {tick} from "svelte";
	import {encodeBase64} from "./util";

	const registerFocus = useFocus();

	let layout: Layout | null = null;
	let driver: LEDDriver | null = null;
	let programBrief: ProgramBrief | null = null;
	let pixelLayout: PixelLayout | null;
	let driverStatus: Writable<DriverStatus> = writable('NotPlaying');
	let driverControl: DriverControl;

	let programWasm: ArrayBuffer | null = null;

	async function selectNewProgram(wasm: ArrayBuffer | null) {
		await driverControl.stop();
		programWasm = wasm;
		await tick(); // Wait for driverControl update
		if (driverControl.canPlay) {
			await driverControl.play();
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
	$: {
		if (driver !== null) {
			const runPayload =
				(programBrief && {programId: programBrief.id}) ||
				(programWasm && {wasm: programWasm});
			driverControl = new ExternalDriver(driver.id, runPayload, $driverStatus, driverStatus);
		} else {
			driverControl = new BrowserAnimationDriver(layout, programWasm, driverStatus);
		}
	}
</script>

<div class="container">
	<div class="block">
		<h1  use:registerFocus class="title">LEDBetter Lights</h1>
	</div>

	<div class="block">
		<WasmDropZone on:wasmDrop={({detail: wasm}) => selectNewProgram(wasm)}>
			<Animation
				aspectRatio={1}
				layout={pixelLayout}
				{programWasm}
				status={driver === null ? $driverStatus : 'NotPlaying'}
			/>
		</WasmDropZone>
	</div>
	<div class="block">
		<div class="columns">
			<div class="column">
				<DriverSelect
					bind:selected={driver}
					on:select={({detail: selected}) => driverStatus.set(selected?.status || 'NotPlaying')}
				/>
			</div>
			<div class="column">
				<LayoutSelect bind:layout={layout} />
			</div>
			<div class="column">
				<ProgramSelect
					bind:program={programBrief}
					on:select={({detail: selected}) => fetchProgramWasm(selected)}
				/>
			</div>
			<div class="column">
				<ControlButtons status={$driverStatus} {driverControl} />
			</div>
		</div>
	</div>
</div>
