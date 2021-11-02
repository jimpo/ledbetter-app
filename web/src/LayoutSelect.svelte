<script lang="ts">
	import axios from 'axios';
	import type {Layout} from 'ledbetter-common';

	export let layout: Layout | null;

	let layoutId = '';
	let layouts: Layout[] = [];

	async function loadLayouts(): Promise<void> {
		const response = await axios.get('/api/layouts');
		layouts = response.data;
	}

	$: layout = layouts.find((layout) => layout.id === layoutId);
</script>

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

