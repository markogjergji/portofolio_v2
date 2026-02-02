// Force scroll to top on page load/refresh
window.history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

window.addEventListener("DOMContentLoaded", () => {
  window.scrollTo(0, 0);

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
    verticalLines.style.opacity = aboutTop <= triggerPoint ? '1' : '0';
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

  // ============ CANVAS ERASER WITH FLASH EFFECT ============
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

    let lastPos = null;
    const INTERPOLATION_SPACING = radius * 0.4;

    // Store the permanent canvas data for redraw
    let permImageData = null;

    function getFullHeight() {
      // Get the maximum possible height including all content
      return Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
    }

    function getFullWidth() {
      return Math.max(
        document.body.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.clientWidth,
        document.documentElement.scrollWidth,
        document.documentElement.offsetWidth
      );
    }

    let currentWidth = 0;
    let currentHeight = 0;
    let resizeTimeout = null;

    function resizeCanvas() {
      const w = getFullWidth();
      const h = getFullHeight();

      // Only resize if dimensions actually changed significantly
      // This prevents constant resizing on mobile toolbar show/hide
      if (Math.abs(w - currentWidth) < 10 && Math.abs(h - currentHeight) < 50) {
        return;
      }

      // Save existing permanent canvas content before resize
      if (currentWidth > 0 && currentHeight > 0) {
        permImageData = permCtx.getImageData(0, 0, permanentCanvas.width, permanentCanvas.height);
      }

      currentWidth = w;
      currentHeight = h;

      // Resize canvases
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";

      permanentCanvas.width = w;
      permanentCanvas.height = h;
      permanentCanvas.style.width = w + "px";
      permanentCanvas.style.height = h + "px";

      // Restore permanent canvas content after resize
      if (permImageData) {
        permCtx.putImageData(permImageData, 0, 0);
      }
    }

    // Initial resize
    resizeCanvas();

    // Debounced resize handler to avoid issues with mobile toolbar
    function handleResize() {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(() => {
        resizeCanvas();
      }, 250);
    }

    window.addEventListener("resize", handleResize);

    // Also check on orientationchange for mobile
    window.addEventListener("orientationchange", () => {
      setTimeout(resizeCanvas, 500);
    });

    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
    function lerpColor(c1, c2, t) {
      return {
        r: Math.round(c1.r + (c2.r - c1.r) * t),
        g: Math.round(c1.g + (c2.g - c1.g) * t),
        b: Math.round(c1.b + (c2.b - c1.b) * t)
      };
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

      if (flashingCircles.length > 0) {
        requestAnimationFrame(animate);
      } else {
        animationRunning = false;
      }
    }

    function addCircleAt(x, y) {
      flashingCircles.push({ x, y, startTime: Date.now() });
      if (!animationRunning) {
        animationRunning = true;
        requestAnimationFrame(animate);
      }
    }

    function addCircleWithInterpolation(x, y) {
      if (lastPos === null) {
        addCircleAt(x, y);
        lastPos = { x, y };
        return;
      }

      const dx = x - lastPos.x;
      const dy = y - lastPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < INTERPOLATION_SPACING) return;

      const steps = Math.ceil(dist / INTERPOLATION_SPACING);
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        addCircleAt(lastPos.x + dx * t, lastPos.y + dy * t);
      }

      lastPos = { x, y };
    }

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
      resetLastPos();
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

  // ============ CONTACT SECTION INVERSION ============
  const contactSection = document.getElementById('contact');
  if (contactSection) {
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
    }, { root: null, rootMargin: '-20% 0px -20% 0px', threshold: 0.3 });

    contactObserver.observe(contactSection);
  }
});
