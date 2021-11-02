<script lang="ts">
	import axios from 'axios';
	import {pixelLayout as layoutLib, Layout, PixelLayout, ProgramBrief} from 'ledbetter-common';
	import Animation from './Animation.svelte';
	import LayoutSelect from './LayoutSelect.svelte';
	import ProgramSelect from './ProgramSelect.svelte';

	let layout: Layout | null = null;
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
		<LayoutSelect bind:layout={layout} />
		<ProgramSelect bind:program={programBrief} />

		<button
			class="button is-success is-light"
			on:click|preventDefault={() => running = true}
			disabled={programWasm === null || running ? true : null}>
			<span class="icon">
				<i class="fas fa-play"></i>
			</span>
		</button>

		<button
			class="button is-danger is-light"
			on:click|preventDefault={() => running = false}
			disabled={programWasm === null || !running ? true : null}>
			<span class="icon">
				<i class="fas fa-stop"></i>
			</span>
		</button>
	</div>
</div>
