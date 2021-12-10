<script lang="ts">
	import ErrorBanner from "./ErrorBanner.svelte";
	import Animation from "./Animation.svelte";
	import LayoutCodeEdit from "./LayoutCodeEdit.svelte";
	import type {PixelLayout} from 'ledbetter-common';
	import {useFocus} from "svelte-navigator";

	export let name: string;
	export let layoutCode: string;
	export let layout: PixelLayout | null  = null;

	export let saving: boolean;
	export let bannerError: string | null = null;

	let nameInput: HTMLInputElement;

	const registerFocus = useFocus();

	export function focusNameInput() {
		nameInput.focus();
	}
</script>

<ErrorBanner bind:errorMessage={bannerError} />

<div class="block">
	<input
		bind:this={nameInput}
		bind:value={name}
		use:registerFocus
		disabled={saving}
		class="input is-large"
		type="text"
		placeholder="Layout name..."
	/>
</div>

<div class="columns">
	<div class="column is-three-quarters">
		<Animation aspectRatio={1} {layout} />
	</div>
	<div class="column">
		<LayoutCodeEdit bind:layout bind:layoutCode disabled={saving} />
	</div>
</div>
