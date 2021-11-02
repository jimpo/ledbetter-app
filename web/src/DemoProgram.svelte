<script lang="ts">
  import axios from 'axios';
	import {pixelLayout as layoutLib, Layout, PixelLayout} from 'ledbetter-common';
	import {decodeBase64} from './util';
	import Animation from './Animation.svelte';

	let layouts: Layout[] = [];
	let layoutId = '';
	let pixelLayout: PixelLayout | null;
	let running: boolean = false;
	let programWasm: BufferSource | null = null;


	async function loadLayouts(): Promise<void> {
		const response = await axios.get('/api/layouts');
		layouts = response.data;
	}

	async function loadPrograms(): Promise<void> {
		const response = await axios.get('/api/programs/test');
		programWasm = decodeBase64(response.data.wasm);
	}

	$: {
		const layout = layouts.find((layout) => layout.id === layoutId);
		pixelLayout = layout ? layoutLib.parseCode(layout.sourceCode) : null;
	}
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
		{#await loadLayouts()}
			<div class="select is-loading">
				<select>
					<option value="">Select layout</option>
				</select>Result: 42
			</div>
		{:then _}
			<div class="select">
				<select bind:value={layoutId}>
					<option value="">Select layout</option>
					{#each layouts as layout}
						<option value={layout.id}>{layout.name}</option>
					{/each}
				</select>
			</div>
		{:catch err}
			<div class="notification is-danger">
				{err}
			</div>
		{/await}

		{#await loadPrograms()}
			<div class="select is-loading">
				<select>
					<option value="">Select program</option>
				</select>
			</div>
		{:then _}
			<div class="select">
				<select>
					<option value="">Select program</option>
					<option value="test" selected>Test</option>
				</select>
			</div>
		{:catch err}
			<div class="notification is-danger">
				{err}
			</div>
		{/await}

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
