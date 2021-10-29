<script lang="ts">
	import {Link} from 'svelte-navigator';

	function handleDragover(event) {
		event.preventDefault();
		//console.log(event);
	}

	function decodeBinStr(binStr: string): Uint8Array {
		const len = binStr.length;
		const decoded = new Uint8Array(len);
		for (let i = 0; i < len; i++) {
			decoded[i] = binStr.charCodeAt(i);
		}
		return decoded;
	}

	function handleDrop(event) {
		//console.log(event);
		console.log(event.dataTransfer);
		if (event.dataTransfer.types.includes("application/wasm")) {
			const x = decodeBinStr(event.dataTransfer.getData("application/wasm"));
			console.log(x.length);
			console.log(x);
		}
		// console.log(event.dataTransfer.items);
		// console.log(event.dataTransfer.items.length);
		// for (let i in event.dataTransfer.items) {
		// 	const x = event.dataTransfer.items[i];
		// 	console.log(x);
		// 	console.log(x.getAsString);
		// 	console.log(x.getAsFile());
		// 	x.getAsString(console.log);
		// 	//.getAsString(console.log);
		// 	//x.getAsString(console.log);
		// }
		// //console.log(event.dataTransfer.files);
		//console.log(event.dataTransfer.getData(event.dataTransfer.types[0]));
	}
</script>

<div class="container">
	<aside class="menu">
		<ul class="menu-list">
			<li><Link to="/demo">Demo Program</Link></li>
			<li><Link to="/layouts/new">New Layout</Link></li>
			<li><Link to="/drivers">LED Drivers</Link></li>
		</ul>
	</aside>

	<div class="notification wasm-drop-area" on:dragover={handleDragover} on:drop={handleDrop}>
		<p>Drop something here</p>
	</div>
</div>
