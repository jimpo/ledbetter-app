<script lang="ts">
	import {pixelLayout, PixelLayout} from "ledbetter-common";

	export let layoutCode: string;
	export let layout: PixelLayout | null;
	export let disabled: boolean;

	let layoutCodeError: Error | null = null;

	$: {
		try {
			layout = pixelLayout.parseCode(layoutCode);
			layoutCodeError = null;
		} catch (err) {
			layout = null;
			layoutCodeError = err;
		}
	}
</script>

<style>
	textarea.layout-code-edit {
		font-family: monospace;
		max-height: none;
	}
	textarea.layout-code-edit.layout-code-valid {
		height: 100%;
	}
	textarea.layout-code-edit.layout-code-invalid {
		height: 65%;
	}
	textarea.layout-code-error {
		height: 35%;
		font-family: monospace;
		background-color: #f5f5f5;
	}
</style>

<textarea
	class="textarea has-fixed-size layout-code-edit"
	class:layout-code-valid={layoutCodeError === null}
	class:layout-code-invalid={layoutCodeError !== null}
	bind:value={layoutCode}
	disabled={disabled}
/>
{#if layoutCodeError !== null}
	<textarea
		class="textarea layout-code-error has-fixed-size is-danger"
		readonly>
		{layoutCodeError.message}
	</textarea>
{/if}
