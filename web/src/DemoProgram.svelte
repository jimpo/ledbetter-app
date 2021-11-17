<script lang="ts">
	import axios from 'axios';
	import {
		pixelLayout as layoutLib, Layout, PixelLayout, ProgramBrief, LEDDriver,
	} from 'ledbetter-common';
	import Animation from './Animation.svelte';
	import LayoutSelect from './LayoutSelect.svelte';
	import ProgramSelect from './ProgramSelect.svelte';
	import DriverSelect from './DriverSelect.svelte';

	let layout: Layout | null = null;
	let driver: LEDDriver | null = null;
	let programBrief: ProgramBrief | null = null;
	let pixelLayout: PixelLayout | null;

	let running: boolean = false;
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
		running = true;
	}

	async function pause() {
		running = false;
	}

	$: pixelLayout = layout ? layoutLib.parseCode(layout.sourceCode) : null;
	$: fetchProgramWasm(programBrief);
</script>

<div class="container">
	<nav class="breadcrumb" aria-label="breadcrumbs">
		<ul>
			<li class="is-active"><a href="/demo" aria-current="page">Demo Program</a></li>
		</ul>
	</nav>

	<div class="block">
		<Animation aspectRatio={1} layout={pixelLayout} {programWasm} {running} />
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
				<button
					class="button is-success is-light"
					on:click|preventDefault={play}
					disabled={programWasm === null || running ? true : null}>
					<span class="icon">
						<i class="fas fa-play"></i>
					</span>
				</button>

				<button
					class="button is-danger is-light"
					on:click|preventDefault={pause}
					disabled={programWasm === null || !running ? true : null}>
					<span class="icon">
						<i class="fas fa-stop"></i>
					</span>
				</button>
			</div>
		</div>
	</div>
</div>
