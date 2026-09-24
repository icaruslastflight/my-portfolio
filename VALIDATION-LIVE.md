# Validation — 19 September 2026

## Completed

**16/16 Node tests:** genre patterns, scene count, bounds, presets, tap timing, normalized spectrum bands, Spotify source restrictions, bitonic sorting, threshold-preserved pixels and eleven unique projects. Reproducible with `npm test`.

**40/40 desktop browser checks:** WebGL shaders compiled and ran without reported GL or uncaught JavaScript errors. Each music genre started at its configured BPM and generated measured spectrum energy. All five requested effects visibly changed output in screenshot comparisons. Sorting instrumentation reported ten compare passes plus source/composite/output passes. Mute, pause, reduced motion, node bypass, local WAV decoding, a local image texture, A/B mix, cleanup, Spotify URL validation/isolation/iframe removal, eleven project cards and case-study dialogs were exercised. Built-in and local input modes made no external HTTP(S) requests before Spotify; object-URL blob reads occurred as expected.

**9/9 responsive/fallback checks:** no horizontal overflow at 320, 390, 768, 1024 and 1440 pixel widths. Touch preset and source controls changed real state. Unavailable microphone input was handled. A no-WebGL run preserved all eleven project cards, displayed the fallback and disabled unavailable visual controls.

The static build completed and includes all eleven case-study narratives in its no-JavaScript fallback. Native JavaScript modules passed syntax checks. The existing public media tree is retained in the GitHub branch rather than duplicated in the source-only ZIP.

## Not verified / not claimed

Spotify remote song playback, sign-in and account-dependent availability were not tested because browser outbound navigation was restricted. URL allowlisting, iframe creation, pause isolation and teardown were tested—not a streamed song.

Hardware microphone capture was restricted in this environment. The unavailable/denied path was tested; getUserMedia's successful capture path still needs a real device check. Existing remote repository images/videos were not exhaustively playback-tested. Generated local image/WAV fixtures verified the texture, decoder and analyzer paths.

Chromium with software OpenGL was used for functional rendering checks. Actual mobile hardware, Safari/Firefox, formal accessibility review and performance benchmarks remain unverified. There is no fixed FPS guarantee.

This release does not implement automatic external-song beat tracking, codec-level datamoshing, arbitrary graph editing, DJ Link/OSC hardware output, Spotify OAuth library access or Spotify visual synchronization. Included music is original synthesized demonstration material, not a commercially mastered soundtrack. No Unit44 clips are bundled. A feature-branch commit is not a verified production deployment.
