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
	import { updated } from '$app/stores';
	import IconButton from '@smui/icon-button';
	import { isOnline } from '$lib/stores';

	let { data }: { data: PageData } = $props();

	let mapContainer: HTMLDivElement,
		map: Map,
		isMapLoaded = $state(false),
		boundaries: Feature<Polygon | MultiPolygon>[] = $state([]),
		previousFeaturesCount = 0,
		confettiParticles: Array<{
			x: number;
			y: number;
			vx: number;
			vy: number;
			life: number;
			maxLife: number;
		}> = [],
		confettiCanvas: HTMLCanvasElement | null = null,
		animationFrameId: number | null = null;

	function triggerConfetti(coords: [number, number]) {
		// Convert lng/lat to screen coordinates
		const point = map.project(coords);
		const x = point.x;
		const y = point.y;

		console.log('triggering confetti at', coords, '->', x, y);

		// Create confetti particles
		const particleCount = 30;
		for (let i = 0; i < particleCount; i++) {
			const angle = (Math.PI * 2 * i) / particleCount;
			const speed = 2 + Math.random() * 2;

			confettiParticles.push({
				x,
				y,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed - 0.5, // Upward bias
				life: 180 + Math.random() * 100,
				maxLife: 300
			});
		}

		// Start animation
		if (confettiCanvas && confettiParticles.length > 0) {
			animateConfetti();
		}
	}

	function animateConfetti() {
		if (!confettiCanvas) return;

		const ctx = confettiCanvas.getContext('2d');
		if (!ctx) return;

		// Clear canvas
		ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

		// Update and draw particles
		for (let i = confettiParticles.length - 1; i >= 0; i--) {
			const p = confettiParticles[i];
			p.life -= 1;

			if (p.life <= 0) {
				confettiParticles.splice(i, 1);
				continue;
			}

			// Apply gravity
			p.vy += 0.1;
			p.x += p.vx;
			p.y += p.vy;

			// Fade out
			const alpha = p.life / p.maxLife;
			ctx.fillStyle = `rgba(255, 95, 5, ${alpha * 0.8})`;
			ctx.beginPath();
			ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
			ctx.fill();
		}

		if (confettiParticles.length > 0) {
			animationFrameId = requestAnimationFrame(animateConfetti);
		}
	}

	function waitForConfettiToEnd(): Promise<void> {
		return new Promise((resolve) => {
			const checkInterval = setInterval(() => {
				if (confettiParticles.length === 0) {
					clearInterval(checkInterval);
					resolve();
				}
			}, 100);
		});
	}

	let pendingBoundaryUpdate: Promise<void> | null = null;

	async function updateOccupiedBoundaries() {
		const occupiedBoundaries = new Set();

		// Wait for any active confetti to finish
		if (confettiParticles.length > 0) {
			await waitForConfettiToEnd();
		}

		await Promise.all(
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
		);

		console.log('finished checking occupied boundaries', occupiedBoundaries);
		map.getLayer('boundaries-fill') &&
			map.setPaintProperty('boundaries-fill', 'fill-color', [
				'match',
				['id'],
				Array.from(occupiedBoundaries),
				'#13294B',
				'transparent'
			]);
	}

	onMount(async () => {
		if (map) return; // initialize map only once
		loading.set(true);
		map = new mapboxgl.Map({
			container: mapContainer,
			accessToken: PUBLIC_MAPBOX_ACCESS_TOKEN,
			style: 'mapbox://styles/mapbox/dark-v11',
			attributionControl: false,
			projection: {
				name: 'mercator' // 2d
			},
			center: [-5.5, 42],
			zoom: 1.9
		});

		map.on('load', async () => {
			isMapLoaded = true;
			(window as any).map = map;

			// Dev function to trigger fake call
			(window as any).addFakeCall = () => {
				const randomLng = -180 + Math.random() * 360;
				const randomLat = -90 + Math.random() * 180;
				const newFeature = {
					type: 'Feature' as const,
					properties: {},
					geometry: {
						type: 'Point' as const,
						coordinates: [randomLng, randomLat] as [number, number]
					}
				};
				data = {
					...data,
					features: [...data.features, newFeature]
				};
			};

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
							0.8,
							'rgba(255,95,5,0.7)'
						],
						// Adjust the heatmap radius by zoom level
						// 'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
						'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 8, 9, 100]
						// Transition from heatmap to circle layer by zoom level
						// 'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0]
					}
				},
				'waterway-label'
			);

			// Create confetti canvas overlay
			confettiCanvas = document.createElement('canvas');
			confettiCanvas.style.position = 'absolute';
			confettiCanvas.style.top = '0';
			confettiCanvas.style.left = '0';
			confettiCanvas.style.zIndex = '10';
			confettiCanvas.style.pointerEvents = 'none';
			confettiCanvas.width = mapContainer.offsetWidth;
			confettiCanvas.height = mapContainer.offsetHeight;
			mapContainer.appendChild(confettiCanvas);

			// Listen to map resize to update canvas size
			map.on('resize', () => {
				if (confettiCanvas) {
					confettiCanvas.width = mapContainer.offsetWidth;
					confettiCanvas.height = mapContainer.offsetHeight;
				}
			});

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

			// Check occupied boundaries on initial load
			await updateOccupiedBoundaries();

			loading.set(false);
		});

		// map.on('move', () => console.log(map.getCenter(), map.getZoom()));
	});

	$effect(() => {
		console.log(data.features);

		if (data.features.length === 0) return; // error state

		// Detect new calls and trigger confetti
		const newCalls = data.features.length - previousFeaturesCount;
		if (newCalls > 0 && previousFeaturesCount > 0) {
			// Get the newly added features
			const startIdx = previousFeaturesCount;
			for (let i = startIdx; i < data.features.length; i++) {
				const feature = data.features[i];
				triggerConfetti(feature.geometry.coordinates);
			}
		}
		previousFeaturesCount = data.features.length;

		console.log('feature count changed, updating map source...');

		map?.getSource<GeoJSONSource>('calls')?.setData({
			type: 'FeatureCollection',
			features: data.features
		});

		console.log('checking occupied boundaries...');

		// Cancel any pending boundary update and start a new one
		pendingBoundaryUpdate = updateOccupiedBoundaries();
	});

	const refresh = () => {
		if (!$isOnline) return; // will throw an error
		if ($updated) location.reload();
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
	{#if !$isOnline}
		<IconButton class="material-icons" aria-label="Offline" title="Offline">cloud_off</IconButton>
	{/if}
	{#if $updated}
		<IconButton class="material-icons" aria-label="Update available" title="Update available"
			>browser_updated</IconButton
		>
	{/if}
	<LoadingRing loading={$loading} />
	<h1>{data.count.toLocaleString()} calls</h1>
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
		bottom: 0;
		/* compensating for overscan */
		right: 1rem;
		padding: 2rem;
		z-index: 1000;
		text-align: right;

		color: white;
	}

	h1 {
		margin: 0;
	}
</style>
