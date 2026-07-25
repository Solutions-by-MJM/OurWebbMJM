/* Scrolling background: layer A holds background image 1, layer B image 2.
   As the page scrolls the stage drifts (so the background scrolls too) and
   crossfades from the first image to the second. Drop real <img> or
   background-image values into .bg-a / .bg-b and nothing else changes. */
(function () {
  var stage = document.querySelector('.bg-stage');
  if (!stage) return;

  var a = stage.querySelector('.bg-a');
  var b = stage.querySelector('.bg-b');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ticking = false;

  function paint() {
    ticking = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;

    // crossfade centred on the middle third of the page
    var fade = Math.min(1, Math.max(0, (p - 0.28) / 0.34));
    b.style.opacity = fade;

    if (!reduced) {
      // parallax drift — the background scrolls with the page, more slowly
      var drift = p * window.innerHeight * 0.32;
      a.style.transform = 'translate3d(0,' + (-drift) + 'px,0)';
      b.style.transform = 'translate3d(0,' + (-drift * 0.72) + 'px,0)';
    }
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(paint); }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  paint();
})();
