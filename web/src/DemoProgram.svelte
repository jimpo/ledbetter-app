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

	$: pixelLayout = layout ? layoutLib.parseCode(layout.sourceCode) : null;
	$: fetchProgramWasm(programBrief);
</script>

<div class="container">
	<div class="block">
		<h1  use:registerFocus class="title">LEDBetter Lights</h1>
	</div>

	<div class="block">
		<Animation
			aspectRatio={1}
			layout={pixelLayout}
			{programWasm}
			status={driver == null ? driverStatus : 'NotPlaying'}
		/>
	</div>
	<div class="block">
		<div class="columns">
			<div class="column">
				<DriverSelect
					bind:selected={driver}
					on:select={({detail: selected}) => driverStatus = selected?.status || 'NotPlaying'}
				/>
			</div>
			<div class="column">
				<LayoutSelect bind:layout={layout} />
			</div>
			<div class="column">
				<ProgramSelect bind:program={programBrief} />
			</div>
			<div class="column">
				<ControlButtons
					bind:status={driverStatus}
					ready={programWasm !== null && (driver !== null || layout !== null)}
					driverId={driver?.id}
					runPayload={programBrief ? {programId: programBrief.id} : null}
				/>
			</div>
		</div>
	</div>
</div>
