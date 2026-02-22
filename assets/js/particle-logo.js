(function () {
    "use strict";

    const canvas = document.getElementById("logo-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    
    // State
    let particles = [];
    let width, height;
    let mouse = { x: -1000, y: -1000, radius: 80 }; // Larger radius for more dramatic mouse interaction

    // Physics constants
    const SPRING = 0.08; 
    const DAMPING = 0.92;
    const PARTICLE_SIZE = 1.4;
    const SPACING = 4;

    // Load Image
    const img = new Image();
    img.src = "assets/poseidon-teal.png";
    img.onload = initParticles;

    function initParticles() {
        width = canvas.clientWidth;
        height = canvas.clientHeight;
        
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const offscreen = document.createElement("canvas");
        const offCtx = offscreen.getContext("2d");
        
        const sampleSize = 55; 
        const aspect = img.height / img.width;
        
        offscreen.width = sampleSize;
        offscreen.height = sampleSize * aspect;
        
        offCtx.drawImage(img, 0, 0, offscreen.width, offscreen.height);
        const imgData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height).data;

        const scaleX = width / offscreen.width;
        const scaleY = height / offscreen.height;
        const baseScale = Math.min(scaleX, scaleY);
        const scale = baseScale * 1.05; 
        
        const offsetX = (width - offscreen.width * scale) / 2;
        const offsetY = (height - offscreen.height * scale) / 2;

        particles = [];

        for (let y = 0; y < offscreen.height; y += Math.max(1, SPACING / scale)) {
            for (let x = 0; x < offscreen.width; x += Math.max(1, SPACING / scale)) {
                const idx = (Math.floor(y) * offscreen.width + Math.floor(x)) * 4;
                const alpha = imgData[idx + 3];
                
                if (alpha > 128) {
                    let r = 57, g = 204, b = 195; // Bright Teal
                    
                    const rand = Math.random();
                    if (rand > 0.95) {
                        r = 252; g = 211; b = 77; // Gold
                    } else if (rand > 0.85) {
                        r = 255; g = 255; b = 255; // White
                    } else if (rand > 0.70) {
                        r = 147; g = 209; b = 255; // Ocean Blue
                    }

                    const targetX = offsetX + x * scale;
                    const targetY = offsetY + y * scale;

                    // Add a random offset factor to create individual rhythmic offset
                    const randomPhase = Math.random() * Math.PI * 2;

                    particles.push({
                        ox: targetX,
                        oy: targetY,
                        x: targetX, 
                        y: targetY,
                        vx: 0,
                        vy: 0,
                        phase: randomPhase,
                        color: `rgba(${r}, ${g}, ${b}, ${alpha / 255})`
                    });
                }
            }
        }
        
        requestAnimationFrame(update);
    }

    // Mouse interaction
    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener("mouseleave", () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    canvas.addEventListener("touchmove", (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.touches[0].clientX - rect.left;
        mouse.y = e.touches[0].clientY - rect.top;
    }, { passive: true });

    canvas.addEventListener("touchend", () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    function update() {
        ctx.clearRect(0, 0, width, height);
        let time = performance.now() * 0.0015; // Drive the rhythm

        ctx.globalCompositeOperation = "lighter";

        for (let i = 0; i < particles.length; i++) {
            let p = particles[i];

            // 1. Organic Rhythm (Sine/Cos wave interference based on position and time)
            let dx = p.ox - p.x;
            let dy = p.oy - p.y;
            
            // Impressive fluid breathing rhythm
            let pulseX = Math.sin(time + p.oy * 0.05 + p.phase) * 1.5;
            let pulseY = Math.cos(time + p.ox * 0.05 + p.phase) * 1.5;
            
            // Apply spring to return to origin, plus the pulse
            p.vx += dx * SPRING + pulseX;
            p.vy += dy * SPRING + pulseY;

            // 2. Mouse Repulsion (Dramatic)
            let mdx = p.x - mouse.x;
            let mdy = p.y - mouse.y;
            let dist = Math.sqrt(mdx * mdx + mdy * mdy);
            
            if (dist < mouse.radius) {
                // The closer the mouse, the stronger the explosion force
                let force = (mouse.radius - dist) / mouse.radius;
                let repelStrength = 15; // Very dramatic repel
                p.vx += (mdx / dist) * force * repelStrength;
                p.vy += (mdy / dist) * force * repelStrength;
            }

            // Apply velocity and damping
            p.vx *= DAMPING;
            p.vy *= DAMPING;
            
            p.x += p.vx;
            p.y += p.vy;

            // Render
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, PARTICLE_SIZE, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalCompositeOperation = "source-over";
        requestAnimationFrame(update);
    }
})();