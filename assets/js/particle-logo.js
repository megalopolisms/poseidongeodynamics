(function () {
    "use strict";

    const canvas = document.getElementById("logo-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    
    // Buttons
    const btnGravity = document.getElementById("gravity-btn");
    const btnFloat = document.getElementById("float-btn");

    // State
    let particles = [];
    let width, height;
    let gravityOn = false;
    let mouse = { x: -1000, y: -1000, radius: 50 }; // Moderate radius for interaction

    // Physics constants
    const SPRING = 0.15; // Much tighter spring so the shape holds together firmly
    const DAMPING = 0.85;
    const GRAVITY = 0.8;
    const BOUNCE = -0.6;
    const PARTICLE_SIZE = 1.8; // Slightly larger for better visibility
    const SPACING = 4; // grid spacing for pixel sampling

    // Load Image
    const img = new Image();
    img.src = "assets/poseidon-teal.png";
    img.onload = initParticles;

    function initParticles() {
        // Set canvas size
        width = canvas.clientWidth;
        height = canvas.clientHeight;
        
        // Use high DPI for crispness
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // Draw image to an offscreen canvas to sample pixels
        const offscreen = document.createElement("canvas");
        const offCtx = offscreen.getContext("2d");
        
        // Target size for sampling
        const sampleSize = 100; 
        const aspect = img.height / img.width;
        
        offscreen.width = sampleSize;
        offscreen.height = sampleSize * aspect;
        
        offCtx.drawImage(img, 0, 0, offscreen.width, offscreen.height);
        const imgData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height).data;

        // Calculate scaling to center the particle logo
        const scaleX = width / offscreen.width;
        const scaleY = height / offscreen.height;
        const baseScale = Math.min(scaleX, scaleY);
        const scale = baseScale * 1.05; // Slightly larger to act as an outline/aura
        
        const offsetX = (width - offscreen.width * scale) / 2;
        const offsetY = (height - offscreen.height * scale) / 2;

        particles = [];

        for (let y = 0; y < offscreen.height; y += Math.max(1, SPACING / scale)) {
            for (let x = 0; x < offscreen.width; x += Math.max(1, SPACING / scale)) {
                // Get pixel index
                const idx = (Math.floor(y) * offscreen.width + Math.floor(x)) * 4;
                const alpha = imgData[idx + 3];
                
                // If pixel is mostly opaque
                if (alpha > 128) {
                    // Create a shiny/glowing effect by injecting bright teal, gold, and white
                    let r = 57, g = 204, b = 195; // Bright Teal base (#39ccc3)
                    
                    const rand = Math.random();
                    if (rand > 0.95) {
                        // Rare Gold sparkle
                        r = 252; g = 211; b = 77;
                    } else if (rand > 0.85) {
                        // Occasional White sparkle
                        r = 255; g = 255; b = 255;
                    } else if (rand > 0.70) {
                        // Lighter Ocean Blue for depth
                        r = 147; g = 209; b = 255;
                    }

                    const targetX = offsetX + x * scale;
                    const targetY = offsetY + y * scale;

                    particles.push({
                        ox: targetX,
                        oy: targetY,
                        x: targetX + (Math.random() - 0.5) * 10, // Very slight initial scatter
                        y: targetY + (Math.random() - 0.5) * 10,
                        vx: 0,
                        vy: 0,
                        color: `rgba(${r}, ${g}, ${b}, ${alpha / 255})`
                    });
                }
            }
        }
        
        // Start animation loop
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

    // Touch interaction
    canvas.addEventListener("touchmove", (e) => {
        e.preventDefault(); // prevent scrolling
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.touches[0].clientX - rect.left;
        mouse.y = e.touches[0].clientY - rect.top;
    }, { passive: false });

    canvas.addEventListener("touchend", () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    // Button interactions
    if (btnGravity) {
        btnGravity.addEventListener("click", () => {
            gravityOn = true;
            btnGravity.classList.replace("text-gray-400", "text-teal");
            btnGravity.classList.replace("border-white/10", "border-teal/30");
            btnGravity.classList.add("bg-teal/10");
            
            if (btnFloat) {
                btnFloat.classList.replace("text-teal", "text-gray-400");
                btnFloat.classList.replace("border-teal/30", "border-white/10");
                btnFloat.classList.remove("bg-teal/10");
            }

            // Gentle scatter on drop so it doesn't look like an explosion
            particles.forEach(p => {
                p.vx += (Math.random() - 0.5) * 8;
                p.vy += Math.random() * -3;
            });
        });
    }

    if (btnFloat) {
        btnFloat.addEventListener("click", () => {
            gravityOn = false;
            btnFloat.classList.replace("text-gray-400", "text-teal");
            btnFloat.classList.replace("border-white/10", "border-teal/30");
            btnFloat.classList.add("bg-teal/10");
            
            if (btnGravity) {
                btnGravity.classList.replace("text-teal", "text-gray-400");
                btnGravity.classList.replace("border-teal/30", "border-white/10");
                btnGravity.classList.remove("bg-teal/10");
            }
        });
    }

    function update() {
        ctx.clearRect(0, 0, width, height);
        let time = performance.now() * 0.001;

        // Lighter blend mode makes overlapping particles glow brightly
        ctx.globalCompositeOperation = "lighter";

        for (let i = 0; i < particles.length; i++) {
            let p = particles[i];

            if (gravityOn) {
                // Apply gravity
                p.vy += GRAVITY;
                
                // Floor bounce
                if (p.y > height - PARTICLE_SIZE) {
                    p.y = height - PARTICLE_SIZE;
                    p.vy *= BOUNCE;
                    p.vx *= 0.9; // Friction
                }
                
                // Wall bounce
                if (p.x < 0) { p.x = 0; p.vx *= BOUNCE; }
                if (p.x > width) { p.x = width; p.vx *= BOUNCE; }

            } else {
                // Return to original shape
                let dx = p.ox - p.x;
                let dy = p.oy - p.y;
                p.vx += dx * SPRING;
                p.vy += dy * SPRING;
                
                // Add dynamic flowing force for a more active "live aura" effect
                let flowX = Math.sin(time * 2 + p.oy * 0.02) * 1.5;
                let flowY = Math.cos(time * 2 + p.ox * 0.02) * 1.5;
                p.vx += flowX + (Math.random() - 0.5) * 1.2;
                p.vy += flowY + (Math.random() - 0.5) * 1.2;
            }

            // Mouse repulsion
            let mdx = p.x - mouse.x;
            let mdy = p.y - mouse.y;
            let dist = Math.sqrt(mdx * mdx + mdy * mdy);
            
            if (dist < mouse.radius) {
                let force = (mouse.radius - dist) / mouse.radius;
                // Softer repel strength so the shape bends but doesn't break
                let repelStrength = gravityOn ? 2 : 4; 
                p.vx += (mdx / dist) * force * repelStrength;
                p.vy += (mdy / dist) * force * repelStrength;
            }

            // Apply velocity and damping
            p.vx *= DAMPING;
            p.vy *= DAMPING;
            
            p.x += p.vx;
            p.y += p.vy;

            // Render particle
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, PARTICLE_SIZE, 0, Math.PI * 2);
            ctx.fill();
        }

        // Reset blend mode
        ctx.globalCompositeOperation = "source-over";

        requestAnimationFrame(update);
    }
})();