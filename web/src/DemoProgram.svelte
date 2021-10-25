<script lang="ts">
  import axios from 'axios';
  import LayoutComponent from './Layout.svelte';
	import {pixelLayout as layoutLib, Layout, PixelLayout} from 'ledbetter-common';

	let layouts: Layout[] = [];
	let layoutId = '';

	async function loadLayouts(): Promise<void> {
		const response = await axios.get('/api/layouts');
		layouts = response.data;
	}

	let pixelLayout: PixelLayout | null;
	$: {
		const layout = layouts.find((layout) => layout.id === layoutId);
		if (layout) {
			pixelLayout = layoutLib.parseCode(layout.sourceCode);
		} else {
			pixelLayout = null;
		}
	}
</script>

<div class="container">
	<div class="columns">
    <div class="column">
			{#if pixelLayout !== null}
			<LayoutComponent width={640} height={640} layout={pixelLayout} />
			{/if}
    </div>
    <div class="column">
			{#await loadLayouts()}
			<div class="select is-loading">
				<select>
					<option value="">Select layout</option>
				</select>
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
    </div>
  </div>
</div>
