// Force scroll to top on page load/refresh
window.history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

window.addEventListener("DOMContentLoaded", () => {
  // Ensure we're at the top after DOM loads too
  window.scrollTo(0, 0);
  // ============ SMOOTH SCROLL (LENIS-LIKE) ============
  class SmoothScroll {
    constructor() {
      this.current = 0;
      this.target = 0;
      this.ease = 0.08;
      this.rafId = null;
      this.init();
    }
    init() {
      window.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.target += e.deltaY;
        this.target = Math.max(0, Math.min(this.target, document.body.scrollHeight - window.innerHeight));
      }, { passive: false });
      window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); this.target += 100; }
        if (e.key === 'ArrowUp') { e.preventDefault(); this.target -= 100; }
        if (e.key === 'PageDown') { e.preventDefault(); this.target += window.innerHeight; }
        if (e.key === 'PageUp') { e.preventDefault(); this.target -= window.innerHeight; }
        if (e.key === 'Home') { e.preventDefault(); this.target = 0; }
        if (e.key === 'End') { e.preventDefault(); this.target = document.body.scrollHeight - window.innerHeight; }
        this.target = Math.max(0, Math.min(this.target, document.body.scrollHeight - window.innerHeight));
      });
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = anchor.getAttribute('href');
          const targetEl = document.querySelector(targetId);
          if (targetEl) {
            const rect = targetEl.getBoundingClientRect();
            this.target = window.pageYOffset + rect.top;
          }
        });
      });
      this.animate();
    }
    animate() {
      this.current += (this.target - this.current) * this.ease;
      if (Math.abs(this.target - this.current) > 0.5) {
        window.scrollTo(0, this.current);
      }
      this.rafId = requestAnimationFrame(() => this.animate());
    }
  }
  //const smoothScroll = new SmoothScroll();

  // ============ VERTICAL LINES VISIBILITY ============
  const verticalLines = document.querySelector('.vertical-lines');
  if (verticalLines) {
    verticalLines.style.opacity = '0';
    verticalLines.style.transition = 'opacity 0.6s ease';
  }
  function checkLinesVisibility() {
    const aboutSection = document.getElementById('about');
    if (!aboutSection || !verticalLines) return;
    const aboutTop = aboutSection.getBoundingClientRect().top;
    const triggerPoint = window.innerHeight * 0.8;
    if (aboutTop <= triggerPoint) {
      verticalLines.style.opacity = '1';
    } else {
      verticalLines.style.opacity = '0';
    }
  }
  window.addEventListener('scroll', checkLinesVisibility);
  checkLinesVisibility();

  // ============ HEADING REVEAL ON SCROLL ============
  const headings = document.querySelectorAll('.section-title, .company-name, .skills-label');
  headings.forEach(heading => {
    heading.style.opacity = '0';
    heading.style.transform = 'translateY(40px)';
    heading.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
  });
  const observerOptions = { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.1 };
  const headingObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        headingObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);
  headings.forEach(heading => headingObserver.observe(heading));

  // ============ INTRO ANIMATION ============
  setTimeout(() => {
    const scroll = document.getElementById("scroll");
    const revealSquare = document.getElementById("reveal-square");
    if (scroll) { scroll.style.zIndex = 1; scroll.style.opacity = 1; }
    if (revealSquare) revealSquare.style.display = "none";
  }, 1700);

  window.addEventListener("scroll", () => {
    const scroll = document.getElementById("scroll");
    const scrollText = document.getElementById("scroll-text");
    if (!scroll) return;
    scroll.style.width = "100%";
    if (scrollText) scrollText.innerText = "";
    if (window.pageYOffset === 0) {
      scroll.style.width = "38vw";
      if (scrollText) scrollText.innerText = "scroll";
    }
  });

  // ============ CANVAS ERASER WITH FLASH EFFECT & SMOOTH INTERPOLATION ============
  setTimeout(() => { initCanvasEraser(); }, 2700);

  function initCanvasEraser() {
    const canvasDiv = document.getElementById("canvas");
    if (!canvasDiv) return;
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.pointerEvents = "none";
    const permanentCanvas = document.createElement("canvas");
    permanentCanvas.style.position = "absolute";
    permanentCanvas.style.top = "0";
    permanentCanvas.style.left = "0";
    permanentCanvas.style.pointerEvents = "none";
    canvasDiv.appendChild(permanentCanvas);
    canvasDiv.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const permCtx = permanentCanvas.getContext("2d");
    const radius = 125;
    const flashingCircles = [];
    const FLASH_DURATION = 800;
    const flashColor = { r: 66, g: 66, b: 66 };
    const finalColor = { r: 17, g: 17, b: 17 };

    // Track last position for interpolation
    let lastPos = null;
    const INTERPOLATION_SPACING = radius * 0.4; // Distance between interpolated circles

    function resizeCanvas() {
      const w = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
      const h = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      [canvas, permanentCanvas].forEach(c => {
        c.width = w; c.height = h;
        c.style.width = w + "px"; c.style.height = h + "px";
      });
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
    function lerpColor(c1, c2, t) {
      return { r: Math.round(c1.r + (c2.r - c1.r) * t), g: Math.round(c1.g + (c2.g - c1.g) * t), b: Math.round(c1.b + (c2.b - c1.b) * t) };
    }

    let animationRunning = false;
    function animate() {
      const now = Date.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < flashingCircles.length; i++) {
        const c = flashingCircles[i];
        const elapsed = now - c.startTime;
        if (elapsed >= FLASH_DURATION) {
          permCtx.beginPath();
          permCtx.arc(c.x, c.y, radius, 0, Math.PI * 2);
          permCtx.fillStyle = "#111111";
          permCtx.fill();
          c.done = true;
        } else {
          const progress = easeOut(elapsed / FLASH_DURATION);
          const col = lerpColor(flashColor, finalColor, progress);
          ctx.beginPath();
          ctx.arc(c.x, c.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgb(${col.r},${col.g},${col.b})`;
          ctx.fill();
        }
      }
      for (let i = flashingCircles.length - 1; i >= 0; i--) {
        if (flashingCircles[i].done) flashingCircles.splice(i, 1);
      }
      if (flashingCircles.length > 0) requestAnimationFrame(animate);
      else animationRunning = false;
    }

    function addCircleAt(x, y) {
      const now = Date.now();
      flashingCircles.push({ x, y, startTime: now });
      if (!animationRunning) { animationRunning = true; requestAnimationFrame(animate); }
    }

    function addCircleWithInterpolation(x, y) {
      if (lastPos === null) {
        // First point, just add it
        addCircleAt(x, y);
        lastPos = { x, y };
        return;
      }

      const dx = x - lastPos.x;
      const dy = y - lastPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < INTERPOLATION_SPACING) {
        // Too close, skip to avoid overdraw
        return;
      }

      // Calculate how many intermediate points we need
      const steps = Math.ceil(dist / INTERPOLATION_SPACING);

      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const ix = lastPos.x + dx * t;
        const iy = lastPos.y + dy * t;
        addCircleAt(ix, iy);
      }

      lastPos = { x, y };
    }

    // Reset lastPos when mouse leaves or touch ends for cleaner separate strokes
    function resetLastPos() {
      lastPos = null;
    }

    document.addEventListener('mousemove', (e) => addCircleWithInterpolation(e.pageX, e.pageY));
    document.addEventListener('mouseleave', resetLastPos);

    document.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      addCircleWithInterpolation(t.pageX, t.pageY);
    }, { passive: true });
    document.addEventListener('touchstart', (e) => {
      resetLastPos(); // Reset on new touch
      const t = e.touches[0];
      addCircleWithInterpolation(t.pageX, t.pageY);
    }, { passive: true });
    document.addEventListener('touchend', resetLastPos, { passive: true });
  }

  // ============ MOUSE FOLLOWING BUBBLE ============
  let mousePos = { x: 0, y: 0 };
  let cursorPos = { x: 0, y: 0 };
  const $cursor = document.querySelector('.bubble');
  if ($cursor) {
    window.addEventListener("mousemove", (e) => {
      mousePos.x = e.pageX;
      mousePos.y = e.pageY - window.scrollY;
    });
    setInterval(() => {
      cursorPos.x += (mousePos.x - cursorPos.x) / 5;
      cursorPos.y += (mousePos.y - cursorPos.y) / 5;
      $cursor.style.left = cursorPos.x + 'px';
      $cursor.style.top = cursorPos.y + 'px';
    }, 20);
  }

  const contactSection = document.getElementById('contact');

  const observerOptions2 = {
    root: null,
    rootMargin: '-20% 0px -20% 0px',
    threshold: 0.3
  };

  const contactObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        contactSection.classList.add('inverted');
        document.body.classList.add('inverted');
      } else {
        contactSection.classList.remove('inverted');
        document.body.classList.remove('inverted');
      }
    });
  }, observerOptions2);

  contactObserver.observe(contactSection);
});
