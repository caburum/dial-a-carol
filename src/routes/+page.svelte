<script lang="ts">
	import mapboxgl, { type Map, type GeoJSONSource, type GeoJSONFeature } from 'mapbox-gl';
	import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '$env/static/public';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import { onDestroy, onMount } from 'svelte';
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { loading } from '$lib/form';
	import LoadingRing from '$lib/LoadingRing.svelte';
	import { point, booleanPointInPolygon } from '@turf/turf';
	import type { Feature, MultiPolygon, Polygon } from 'geojson';

	let { data }: { data: PageData } = $props();

	let mapContainer: HTMLDivElement,
		map: Map,
		isMapLoaded = $state(false),
		boundaries: Feature<Polygon | MultiPolygon>[] = $state([]);

	onMount(async () => {
		if (map) return; // initialize map only once
		map = new mapboxgl.Map({
			container: mapContainer,
			accessToken: PUBLIC_MAPBOX_ACCESS_TOKEN,
			style: 'mapbox://styles/mapbox/dark-v11',
			projection: {
				name: 'mercator' // 2d
			},
			center: [-50, 20],
			zoom: 2
		});

		map.on('load', async () => {
			isMapLoaded = true;
			(window as any).map = map;

			map.addSource('calls', {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: data.features
				}
			});

			// map.addLayer(
			// 	{
			// 		id: 'calls-point',
			// 		type: 'circle',
			// 		source: 'calls',
			// 		minzoom: 9,
			// 		paint: {
			// 			'circle-radius': 8,
			// 			'circle-color': 'white',
			// 			'circle-stroke-color': 'white',
			// 			'circle-stroke-width': 1,
			// 			'circle-opacity': 1
			// 		}
			// 	},
			// 	'waterway-label'
			// );

			map.addLayer(
				{
					id: 'calls-heat',
					type: 'heatmap',
					source: 'calls',
					maxzoom: 15,
					paint: {
						// Increase the heatmap weight based on frequency and property magnitude
						// 'heatmap-weight': ['interpolate', ['linear'], ['get', 'mag'], 0, 0, 6, 1],
						'heatmap-weight': 0.5,
						// Increase the heatmap color weight weight by zoom level
						// heatmap-intensity is a multiplier on top of heatmap-weight
						'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
						// Color ramp for heatmap. Domain is 0 (low) to 1 (high).
						// Begin color ramp at 0-stop with a 0-transparancy color
						// to create a blur-like effect.
						'heatmap-color': [
							'interpolate',
							['linear'],
							['heatmap-density'],
							0,
							'rgba(255,95,5,0)',
							0.2,
							'rgba(255,95,5,0.2)',
							1,
							'rgba(255,95,5,0.8)'
						],
						// Adjust the heatmap radius by zoom level
						// 'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
						'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 15, 9, 100]
						// Transition from heatmap to circle layer by zoom level
						// 'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0]
					}
				},
				'waterway-label'
			);

			// https://docs.mapbox.com/mapbox-gl-js/assets/us_states.geojson
			// https://raw.githubusercontent.com/datasets/geo-countries/main/data/countries.geojson
			// /boundaries.geojson
			let boundariesData: {
				type: 'FeatureCollection';
				features: Feature<Polygon | MultiPolygon>[];
			} = await fetch('./boundaries.geojson').then((r) => r.json());

			map.addSource('boundaries', {
				type: 'geojson',
				data: boundariesData
			});
			boundaries = boundariesData.features;

			map.addLayer(
				{
					id: 'boundaries-fill',
					type: 'fill',
					source: 'boundaries',
					paint: {
						'fill-color': 'transparent',
						'fill-opacity': 0.5
					}
				},
				'calls-heat'
			);
			console.log('done loading');
		});

		// map.on('move', () => console.log(map.getCenter(), map.getZoom()));
	});

	$effect(() => {
		console.log(data.features);
		map?.getSource<GeoJSONSource>('calls')?.setData({
			type: 'FeatureCollection',
			features: data.features
		});

		console.log('checking occupied boundaries...');
		const occupiedBoundaries = new Set();

		Promise.all(
			data.features.map((feature) => {
				return new Promise<void>((resolve) => {
					const pt = point(feature.geometry.coordinates);
					for (const boundaryFeature of boundaries) {
						if (booleanPointInPolygon(pt, boundaryFeature.geometry)) {
							occupiedBoundaries.add(boundaryFeature.id);
							break;
						}
					}
					resolve();
				});
			})
		).then(() => {
			console.log('finished checking occupied boundaries', occupiedBoundaries);
			map.getLayer('boundaries-fill') &&
				map.setPaintProperty('boundaries-fill', 'fill-color', [
					'match',
					['id'], // ['get', 'name'],
					Array.from(occupiedBoundaries),
					'#13294B', // Highlight color
					'transparent' // Default color (no match)
				]);
		});
	});

	const refresh = () => {
		loading.set(true);
		invalidateAll().finally(() => {
			loading.set(false);
		});
	};

	onMount(() => {
		const interval = setInterval(refresh, 2 * 60000);
		return () => clearInterval(interval);
	});

	onDestroy(() => {
		map?.remove();
	});
</script>

<svelte:window
	onkeypress={(e) => {
		if (e.key === 'r') refresh();
	}}
/>

<div class="mapContainer" bind:this={mapContainer}></div>

<div class="buttons">
	<LoadingRing loading={$loading} />
</div>

<style>
	:global(body) {
		margin: 0;
		height: 100vh;
		width: 100vw;
	}

	.mapContainer {
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.buttons {
		position: fixed;
		top: 0;
		right: 0;
		padding: 1rem;
		z-index: 1000;

		color: white;
	}
</style>
