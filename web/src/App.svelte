<script lang="ts">
	import {Router, Route} from "svelte-navigator";
	import 'bulma/css/bulma.css';
	import '@fortawesome/fontawesome-free/scss/solid.scss';
	import '@fortawesome/fontawesome-free/scss/regular.scss';
	import '@fortawesome/fontawesome-free/scss/fontawesome.scss';

	import DemoProgram from './pages/DemoProgram.svelte';
	import NewLayout from './pages/NewLayout.svelte';
	import NewProgram from './pages/NewProgram.svelte';
	import ShowProgram from './pages/ShowProgram.svelte';
	import ShowLayout from './pages/ShowLayout.svelte';
</script>

<main class="section">
	<Router>
		<Route path="/" component={DemoProgram}/>
		<Route path="layouts/new" component={NewLayout}/>
		<Route path="layouts/:layoutId" component={ShowLayout}/>
		<Route path="programs/new" component={NewProgram}/>
		<Route path="programs/:programId" component={ShowProgram}/>
	</Router>
</main>
