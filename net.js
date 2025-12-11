(() => {
      // --- CONFIGURATION ---
      const cfg = {
        color: "#2E5E4E",
        linkDistSq: 270 ** 2, // Increased distance (was 180)
        limit: 180,           // Max particles
        density: 11000,       // Higher = fewer particles
        speed: 0.4,           // Constant slow drift speed
        mouseForce: 0.04,     // Very gentle interaction
        mouseRadSq: 200 ** 2,
        duration: 40000,
        fade: 4000
      };

      // --- STATE ---
      let ctx, w, h, rafId, killTimer;
      let particles = [];
      const mouse = { x: 0, y: 0, active: false };
      const root = document.getElementById("bg") || document.body;

      // --- PARTICLE ENGINE ---
      class Node {
        constructor() {
          this.x = Math.random() * w;
          this.y = Math.random() * h;
          // Constant, slow velocity. No friction/acceleration jitter.
          this.vx = (Math.random() - 0.5) * cfg.speed;
          this.vy = (Math.random() - 0.5) * cfg.speed;
          this.size = 1.5;
        }

        update() {
          // Move
          this.x += this.vx;
          this.y += this.vy;

          // Bounce off walls (Stable)
          if (this.x < 0 || this.x > w) this.vx *= -1;
          if (this.y < 0 || this.y > h) this.vy *= -1;

          // Gentle Mouse Interaction
          if (mouse.active) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dSq = dx * dx + dy * dy;

            if (dSq < cfg.mouseRadSq) {
              const force = (cfg.mouseRadSq - dSq) / cfg.mouseRadSq;
              const ang = Math.atan2(dy, dx);

              // Push gently, but don't permanently alter course too much
              this.x -= Math.cos(ang) * force * cfg.mouseForce * 20;
              this.y -= Math.sin(ang) * force * cfg.mouseForce * 20;
            }
          }
        }

        draw() {
          // Back to circles
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- RENDER LOOP ---
      const draw = () => {
        if (!ctx) return;
        ctx.clearRect(0, 0, w, h);

        ctx.fillStyle = cfg.color;
        ctx.strokeStyle = cfg.color;
        ctx.lineWidth = 0.5; // Fine lines

        // Update & Draw Particles
        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i];
          p1.update();
          p1.draw();

          // Draw Connections
          // Start loop at i+1 to avoid double-drawing or self-linking
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < cfg.linkDistSq) {
              // Calculate opacity only when needed
              const opacity = 1 - Math.sqrt(distSq) / Math.sqrt(cfg.linkDistSq);
              ctx.globalAlpha = opacity;

              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
        // Reset alpha for dots
        ctx.globalAlpha = 1;

        rafId = requestAnimationFrame(draw);
      };

      // --- INIT / DESTROY ---
      const init = () => {
        if (rafId) return;

        let cvs = root.querySelector('canvas');
        if (!cvs) {
          cvs = document.createElement('canvas');
          cvs.style.cssText = `position:fixed;top:0;left:0;pointer-events:none;opacity:0;transition:opacity 2s;z-index:-1;`;
          root.appendChild(cvs);
        }

        ctx = cvs.getContext('2d');
        resize(cvs);

        requestAnimationFrame(() => cvs.style.opacity = 1);

        clearTimeout(killTimer);
        killTimer = setTimeout(kill, cfg.duration);

        draw();
      };

      const kill = () => {
        const cvs = root.querySelector('canvas');
        if (!cvs) return;
        cvs.style.opacity = 0;
        setTimeout(() => {
          if (rafId) cancelAnimationFrame(rafId);
          rafId = null;
          cvs.remove();
          ctx = null;
          particles = [];
        }, cfg.fade);
      };

      const resize = (cvs) => {
        w = cvs.width = window.innerWidth;
        h = cvs.height = window.innerHeight;

        const count = Math.min(cfg.limit, Math.floor((w * h) / cfg.density));
        particles = Array.from({ length: count }, () => new Node());
      };

      // --- EVENTS ---
      window.addEventListener('resize', () => ctx && resize(root.querySelector('canvas')));
      window.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
      });
      document.addEventListener('visibilitychange', () => document.hidden ? kill() : init());

      init();
    })();