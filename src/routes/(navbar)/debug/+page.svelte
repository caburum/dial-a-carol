<script lang="ts">
	import type { PageData } from '../$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let countryCode = $state(1);
	let phone = $state('');
	let location = $state('');

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

<form onsubmit={geocode}>
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
			onkeypress={(e) => {
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
	<p>{JSON.stringify(location)}</p>
{/if}
