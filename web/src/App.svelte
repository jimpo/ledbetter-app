<script lang="ts">
	import {Router, Route} from "svelte-navigator";
	import 'bulma/css/bulma.css';
	import '@fortawesome/fontawesome-free/scss/solid.scss';
	import '@fortawesome/fontawesome-free/scss/regular.scss';
	import '@fortawesome/fontawesome-free/scss/fontawesome.scss';

	import DemoProgram from './DemoProgram.svelte';
	import Devices from './Devices.svelte';
	import Drivers from './Drivers.svelte';
	import NewLayout from './NewLayout.svelte';
	import NewProgram from './NewProgram.svelte';
	import ShowProgram from './ShowProgram.svelte';
</script>

<main class="section">
	<Router>
		<Route path="/" component={DemoProgram}/>
		<Route path="devices/" component={Devices}/>
		<Route path="drivers/" component={Drivers}/>
		<Route path="layouts/new" component={NewLayout}/>
		<Route path="programs/new" component={NewProgram}/>
		<Route path="programs/:id" component={ShowProgram}/>
	</Router>
</main>
