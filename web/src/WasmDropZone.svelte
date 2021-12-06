<script lang="ts">
	import {createEventDispatcher} from 'svelte';

	const dispatch = createEventDispatcher();

	function getWasmFile(dataTransfer: DataTransfer): File | null {
		if (dataTransfer.items.length !== 1) {
			return null;
		}

		const item = dataTransfer.items[0];
		const isWasmFile = item.kind == 'file' && item.type == 'application/wasm';
		return isWasmFile ? item.getAsFile() : null;
	}

	function handleDragover(_event: DragEvent) {
	}

	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		const file = getWasmFile(event.dataTransfer);
		if (file === null) {
			alert('Drag and drop a single Wasm file');
			return;
		}

		const wasmProgram = await file.arrayBuffer();
		dispatch('wasmDrop', wasmProgram);
	}
</script>

<div on:dragover|preventDefault={handleDragover} on:drop|preventDefault={handleDrop}>
	<slot/>
</div>
