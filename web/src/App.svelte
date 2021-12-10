<script lang="ts">
	import {Router, Route} from "svelte-navigator";
	import 'bulma/css/bulma.css';
	import '@fortawesome/fontawesome-free/scss/solid.scss';
	import '@fortawesome/fontawesome-free/scss/regular.scss';
	import '@fortawesome/fontawesome-free/scss/fontawesome.scss';

	import DemoProgram from './DemoProgram.svelte';
	import NewLayout from './NewLayout.svelte';
	import NewProgram from './NewProgram.svelte';
	import ShowProgram from './ShowProgram.svelte';
</script>

<main class="section">
	<Router>
		<Route path="/" component={DemoProgram}/>
		<Route path="layouts/new" component={NewLayout}/>
		<Route path="programs/new" component={NewProgram}/>
		<Route path="programs/:programId" component={ShowProgram}/>
	</Router>
</main>
