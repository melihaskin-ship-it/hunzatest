/* Hunza "You might also be interested in..." programs slider.
   Defines the global slidePrograms(dir) used by the prev/next arrows and by the
   inline tap handler, plus touch/mouse swipe. Position is derived from the real
   rendered geometry of the cards, so it stays correct across every responsive
   breakpoint (desktop multi-card, mobile single-card peek, etc.). */
(function () {
  'use strict';

  function init() {
    var viewport = document.getElementById('programsViewport');
    var track = document.getElementById('programsTrack');
    if (!viewport || !track) return;

    var cards = Array.prototype.slice.call(track.querySelectorAll('.prog-card'));
    if (!cards.length) return;

    var prevBtn = document.getElementById('progPrev');
    var nextBtn = document.getElementById('progNext');
    var index = 0;

    // Left offset of card i relative to the first card (px).
    function offsetForIndex(i) {
      if (i <= 0) return 0;
      if (i >= cards.length) i = cards.length - 1;
      return cards[i].offsetLeft - cards[0].offsetLeft;
    }

    // Furthest shift before the track's right edge reaches the viewport edge.
    function maxShift() {
      return Math.max(0, track.scrollWidth - viewport.clientWidth);
    }

    // Highest index we can land on without overscrolling past the last card.
    function maxIndex() {
      var limit = maxShift();
      for (var i = 0; i < cards.length; i++) {
        if (offsetForIndex(i) >= limit - 1) return i;
      }
      return cards.length - 1;
    }

    function clampIndex(i) {
      var mx = maxIndex();
      if (i < 0) return 0;
      if (i > mx) return mx;
      return i;
    }

    function applyShift(px) {
      track.style.transform = 'translateX(' + (-px) + 'px)';
    }

    function updateArrows() {
      var mx = maxIndex();
      if (prevBtn) prevBtn.style.opacity = index <= 0 ? '0.35' : '1';
      if (nextBtn) nextBtn.style.opacity = index >= mx ? '0.35' : '1';
    }

    function snapToIndex() {
      index = clampIndex(index);
      applyShift(Math.min(offsetForIndex(index), maxShift()));
      updateArrows();
    }

    // Global entry point used by the arrow buttons and the inline tap handler.
    window.slidePrograms = function (dir) {
      index = clampIndex(index + (dir || 0));
      track.style.transition = 'transform 0.45s cubic-bezier(0.16,1,0.3,1)';
      snapToIndex();
    };

    // ── Swipe / drag ─────────────────────────────────────────────────────────
    var dragging = false;
    var startX = 0;
    var startShift = 0;
    var moved = false;

    function currentShift() {
      var m = /translateX\(\s*(-?[0-9.]+)px/.exec(track.style.transform || '');
      return m ? -parseFloat(m[1]) : 0;
    }

    function dragStart(x) {
      dragging = true;
      moved = false;
      startX = x;
      startShift = currentShift();
      track.style.transition = 'none';
      viewport.style.cursor = 'grabbing';
    }

    function dragMove(x) {
      if (!dragging) return;
      var dx = x - startX;
      if (Math.abs(dx) > 4) moved = true;
      var next = startShift - dx;
      var limit = maxShift();
      if (next < 0) next = 0;
      if (next > limit) next = limit;
      applyShift(next);
    }

    function dragEnd(x) {
      if (!dragging) return;
      dragging = false;
      viewport.style.cursor = 'grab';
      track.style.transition = 'transform 0.45s cubic-bezier(0.16,1,0.3,1)';
      var dx = x - startX;
      if (moved && Math.abs(dx) > 40) {
        window.slidePrograms(dx < 0 ? 1 : -1);
      } else {
        snapToIndex(); // treat as tap (inline handler navigates) / snap back
      }
    }

    viewport.addEventListener('mousedown', function (e) { dragStart(e.clientX); });
    window.addEventListener('mousemove', function (e) { dragMove(e.clientX); });
    window.addEventListener('mouseup', function (e) { dragEnd(e.clientX); });

    viewport.addEventListener('touchstart', function (e) {
      dragStart(e.touches[0].clientX);
    }, { passive: true });
    viewport.addEventListener('touchmove', function (e) {
      dragMove(e.touches[0].clientX);
    }, { passive: true });
    viewport.addEventListener('touchend', function (e) {
      var t = e.changedTouches && e.changedTouches[0];
      dragEnd(t ? t.clientX : startX);
    });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(snapToIndex, 120);
    });

    // Re-measure once images have loaded (card heights/widths can shift).
    window.addEventListener('load', snapToIndex);

    snapToIndex();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
