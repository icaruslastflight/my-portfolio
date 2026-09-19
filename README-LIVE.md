# Primordial / a portfolio you can play

An original browser VJ instrument for Brice Morneau: four procedural 3D scenes, five built-in music sketches, eleven project case studies and a live effects rack. The interface uses clip-launcher and signal-flow conventions without copying Resolume, Derivative or Unit44 branding or assets.

## Start the set

The default drum-and-bass sketch is already selected. Press Play or select a genre to enable audio; browsers generally require interaction for audible playback. The five original synthesized demos are Night transmission (drum & bass, 172 BPM), Concrete swing (gangsta house, 126 BPM), Black circuit (midtempo, 100 BPM), Sub architecture (140 / halftime) and After-hours signal (UK garage, 132 BPM).

These are sixteen-bar algorithmically authored demo arrangements, not commercial recordings, artist tracks or a finished licensed soundtrack. Drums, bass, chord stabs and variation are synthesized locally. No API key, account, sample download or upload is required for the built-in set.

Built-in visuals follow the same AudioContext clock as the sequencer. Uploaded music and microphone input drive low/mid/high frequency reactivity with manual BPM and tap timing, not automatic beat tracking or DJ Link. Mic is never routed to the speakers. Local files use object URLs and are not uploaded. Audio is limited to 80 MB; visual imports to 150 MB. Hiding/leaving the page pauses audio and releases mic capture. Audio starts quietly; reduced-motion preferences keep visuals still until explicitly enabled.

## Visual engine and effects

Monolith district, Portal sequence, Signal terrain and Chrome organism are original procedural WebGL studies. Existing same-origin portfolio video/images can be loaded into layer B, blended with layer A, and processed. Local visual import is also supported.

- Datamosh-style temporal smearing samples prior frames with block displacement and change gating. This approximates the look; it is not codec-level I-frame corruption or optical-flow estimation. Hold M for a momentary burst.
- Pixel sorting uses ten GPU bitonic compare passes over sixteen-pixel horizontal blocks, with threshold gating and a wet/dry amount. It actually reorders luminance but is not full-scanline sorting.
- Artifacting combines RGB separation, macroblock offsets and quantization.
- Feedback uses persistent ping-pong frame buffers with rescaling/rotation and an explicit history clear.
- Displacement warps spatial coordinates with low-frequency audio modulation.

Scale, rotation, hue, mirror, speed, modulation and A/B mix are live controls. Presets update real parameters. Signal flow is a fixed functional bypass chain, not a general node editor. Space plays/pauses the session, T taps tempo, 1–4 launch scenes, R resets, and M performs a smear. Visual pause is independent of music. No strobe effect is provided; other fast motion/glitch effects can still be uncomfortable.

## Spotify is a separate listening room

Paste a full Spotify track, album or playlist link to load Spotify's official embed. This is link-based embedded playback, **not an implemented Spotify OAuth account/library connection**. Spotify controls sign-in, previews, availability and account restrictions. Opening the room pauses the VJ engine and other audio and disconnects mic; closing removes the iframe. No Spotify audio is captured, analyzed, mixed, beat-matched or synchronized to visuals. Player creation is not presented as successful song playback.

## Build and maintenance

Use Node 22. The new browser runtime has no package dependencies. Original React/Vite dependency entries and source files are retained for rollback; the root entry point now selects the live experience. Dependency specifications did not change, so the existing lockfile remains applicable.

```sh
npm test
npm run dev
npm run build
npm run preview
```

The static build copies the existing `public` directory unchanged, copies native modules to `dist/assets`, and includes complete no-JavaScript case-study text. Netlify builds with `npm run build` and publishes `dist`. Fixed-name assets revalidate instead of being treated as content-hashed. The old React prerender script is not used.

`src/live/model.mjs` owns bounds, presets and patterns; `audio.mjs` owns synthesis/input; `render.mjs` owns WebGL; `app.mjs` owns UI/media lifecycle; `projects.mjs` owns project copy; `style.css` owns the responsive layout. `window.liveDiagnostics()` exposes runtime counters and state, not audio or visitor data.

The downloadable source package is an overlay for the existing repository, not a backup of its large binary media. The standalone HTML preview contains graphics/music inline; project-media and résumé links point to the existing public portfolio host. Remote CORS restrictions can prevent using that media as textures in the portable copy. Built-in scenes, music and local imports work independently of those remote files.

## Validation and remaining checks

Sixteen unit tests passed; forty desktop browser checks and nine responsive/fallback checks passed during the build session. This includes actual shader execution, visible effect output changes, measured energy from all five music sketches, local file decoding, mixing and Spotify isolation. See VALIDATION-LIVE.md for scope. No claim is made of a fixed FPS, production deployment, full Spotify playback, hardware microphone validation or comprehensive accessibility certification.

## References / assets

Reviewed 19 September 2026:

- Enter7 reference: https://resolume.com/footage/enter7
- CityBlocks reference: https://resolume.com/footage/cityblocks
- Spotify developer policy: https://developer.spotify.com/policy
- Spotify official embeds: https://developer.spotify.com/documentation/embeds
- Audible autoplay: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay

No Unit44 files or third-party commercial songs are bundled. Obtain appropriate website redistribution permission before adding purchased loop packs to a public browser deck. Existing project media comes from the original repository. Unsupported exact latency, uptime, accuracy and test-count claims from older portfolio copy were not repeated.
