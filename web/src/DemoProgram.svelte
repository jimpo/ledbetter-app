<script lang="ts">
  import axios from 'axios';
  import Layout from './Layout.svelte';
  import {layout as layoutLib} from 'ledbetter-common';

	let layouts = [];
	let layoutId = '';

	async function loadLayouts(): Promise<void> {
		const response = await axios.get('/api/layouts');
		layouts = response.data;
	}

	let pixelLayout;
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
			<Layout width={640} height={640} layout={pixelLayout} />
			{/if}
    </div>
    <div class="column">
			{#await loadLayouts()}
			<div class="select is-loading">
				<select>
					<option value="">Select layout</option>
				</select>
			</div>
		  {:then}
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
