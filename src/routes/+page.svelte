<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	let countryCode = 1;
	let phone = '';
	let location = '';

	async function geocode() {
		const res = await fetch('/api/geocode', {
			method: 'POST',
			body: new URLSearchParams({ countryCode: countryCode.toString(), phone }).toString(),
			headers: {
				'content-type': 'application/x-www-form-urlencoded'
			}
		});
		const data = await res.json();
		if (!res.ok) {
			location = data.message;
		} else {
			location = data.location;
		}
	}
</script>

<form on:submit={geocode}>
	<label>
		<span>Country code:</span><br />
		<input type="number" bind:value={countryCode} />
	</label>
	<label>
		<span>Phone number:</span><br />
		<input
			type="text"
			bind:value={phone}
			pattern="[0-9]*"
			inputmode="numeric"
			on:keypress={(e) => {
				if (e.key.length === 1 && !/[0-9]/.test(e.key)) {
					e.preventDefault();
				}
			}}
		/>
	</label>
	<br />
	<button type="submit" disabled={!countryCode || !phone}>Geocode</button>
</form>

{#if location}
	<p>{location}</p>
{/if}
