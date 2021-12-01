<script lang="ts">
	import axios, {AxiosResponse} from 'axios';
	import {
		pixelLayout as layoutLib, Layout, PixelLayout, ProgramBrief, LEDDriver, DriverStatus,
	} from 'ledbetter-common';
	import {useFocus, Link} from 'svelte-navigator';
	import Animation from './Animation.svelte';
	import LayoutSelect from './LayoutSelect.svelte';
	import ProgramSelect from './ProgramSelect.svelte';
	import DriverSelect from './DriverSelect.svelte';
	import ControlButtons from "./ControlButtons.svelte";

	const registerFocus = useFocus();

	let layout: Layout | null = null;
	let driver: LEDDriver | null = null;
	let programBrief: ProgramBrief | null = null;
	let pixelLayout: PixelLayout | null;
	let driverStatus: DriverStatus = 'NotPlaying';

	let programWasm: BufferSource | null = null;

	async function fetchProgramWasm(programBrief: ProgramBrief | null) {
		if (programBrief) {
			const response = await axios.get(
				`/api/programs/${programBrief.id}/main.wasm`,
				{responseType: 'arraybuffer'},
			);
			programWasm = response.data;
		} else {
			programWasm = null;
		}
	}

	async function play() {
		if (!programBrief) {
			return;
		}

		if (driver) {
			let response: AxiosResponse;
			if (driverStatus === 'Paused') {
				response = await axios.post(`/api/drivers/${driver.id}/unpause`);
			} else if (programBrief) {
				const payload = {programId: programBrief.id};
				response = await axios.post(`/api/drivers/${driver.id}/run`, payload);
			} else {
				console.error('Play button pressed and unable to play');
				return;
			}
			const {status}: {status: DriverStatus} = response.data;
			driverStatus = status;
		} else {
			driverStatus = 'Playing';
		}
	}

	async function pause() {
		if (driver) {
			const response = await axios.post(`/api/drivers/${driver.id}/pause`);
			const {status}: {status: DriverStatus} = response.data;
			driverStatus = status;
		} else {
			driverStatus = 'Paused';
		}
	}

	async function stop() {
		if (!programBrief) {
			return;
		}

		if (driver) {
			const response = await axios.post(`/api/drivers/${driver.id}/stop`);
			const {status}: {status: DriverStatus} = response.data;
			driverStatus = status;
		} else {
			driverStatus = 'NotPlaying';
		}
	}

	$: pixelLayout = layout ? layoutLib.parseCode(layout.sourceCode) : null;
	$: fetchProgramWasm(programBrief);
</script>

<div class="container">
	<div class="block">
		<h1  use:registerFocus class="title">LEDBetter Lights</h1>
	</div>

	<div class="block">
		<Animation aspectRatio={1} layout={pixelLayout} {programWasm} status={driverStatus} />
	</div>
	<div class="block">
		<div class="columns">
			<div class="column">
				<DriverSelect bind:selected={driver} />
			</div>
			<div class="column">
				<LayoutSelect bind:layout={layout} />
			</div>
			<div class="column">
				<ProgramSelect bind:program={programBrief} />
			</div>
			<div class="column">
				<ControlButtons
					ready={programWasm !== null && layout !== null}
					status={driverStatus}
					onPlay={play}
					onPause={pause}
					onStop={stop}
				/>
			</div>
		</div>
	</div>
</div>
