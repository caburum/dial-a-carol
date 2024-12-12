<script lang="ts">
	import mapboxgl, { type Map } from 'mapbox-gl';
	import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '$env/static/public';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import { onDestroy, onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let mapContainer: HTMLDivElement,
		map: Map,
		isMapLoaded = false;

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

		map.on('load', () => {
			isMapLoaded = true;

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
						'heatmap-radius': [
							'interpolate',
							['linear'],
							['zoom'],
							4,
							['interpolate', ['linear'], ['heatmap-density'], 0, 10, 1, 200],
							9,
							['interpolate', ['linear'], ['heatmap-density'], 0, 60, 1, 500]
						]
						// Transition from heatmap to circle layer by zoom level
						// 'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0]
					}
				},
				'waterway-label'
			);
		});

		map.on('move', () => console.log(map.getCenter(), map.getZoom()));
	});

	onDestroy(() => {
		map?.remove();
	});
</script>

<div class="mapContainer" bind:this={mapContainer}></div>

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
</style>
