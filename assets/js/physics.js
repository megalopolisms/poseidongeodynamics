/* ============================================================
   POSEIDON GEODYNAMICS — Antigravity Physics Engine
   Custom 2D physics: gravity toggle, collisions, mouse/touch
   Google Antigravity-style interaction with helical pile parts
   ============================================================ */

(function () {
  "use strict";

  // ─── Configuration ───
  var CONFIG = {
    GRAVITY: 980, // pixels/s^2
    DAMPING: 0.98, // velocity damping per frame
    RESTITUTION: 0.5, // bounce factor
    FRICTION: 0.8, // surface friction
    FLOAT_SPEED: 0.3, // floating drift speed
    FLOAT_AMPLITUDE: 30, // floating drift range (px)
    MOUSE_FORCE: 800, // throw force multiplier
    OBJECT_COUNT: 16, // number of floating objects
    MOBILE_COUNT: 10, // reduced for mobile
    LINE_WIDTH: 2,
    FONT: '600 11px "Inter", sans-serif',
    LABEL_FONT: '500 9px "JetBrains Mono", monospace',
  };

  // Brand colors
  var COLORS = {
    oceanDeep: "#1a3a5c",
    oceanMid: "#2a5a8c",
    oceanLight: "#3a7abd",
    teal: "#2da8a0",
    tealBright: "#34c5bb",
    gold: "#c9a84c",
    goldBright: "#dbbf6a",
    border: "#e5e7eb",
    white: "#ffffff",
    subtle: "#f7f8fa",
  };

  // Object types representing helical pile components
  var OBJECT_TYPES = [
    {
      type: "helix",
      label: '10" Helix',
      w: 50,
      h: 50,
      color: COLORS.teal,
      borderColor: COLORS.oceanDeep,
    },
    {
      type: "helix",
      label: '12" Helix',
      w: 58,
      h: 58,
      color: COLORS.teal,
      borderColor: COLORS.oceanDeep,
    },
    {
      type: "helix",
      label: '14" Helix',
      w: 64,
      h: 64,
      color: COLORS.tealBright,
      borderColor: COLORS.oceanMid,
    },
    {
      type: "helix",
      label: '16" Helix',
      w: 72,
      h: 72,
      color: COLORS.tealBright,
      borderColor: COLORS.oceanMid,
    },
    {
      type: "shaft",
      label: "RS2875",
      w: 24,
      h: 100,
      color: COLORS.oceanDeep,
      borderColor: COLORS.oceanMid,
    },
    {
      type: "shaft",
      label: "RS350",
      w: 28,
      h: 110,
      color: COLORS.oceanDeep,
      borderColor: COLORS.oceanMid,
    },
    {
      type: "shaft",
      label: "RS450",
      w: 32,
      h: 95,
      color: COLORS.oceanMid,
      borderColor: COLORS.oceanDeep,
    },
    {
      type: "shaft",
      label: "RS6625",
      w: 36,
      h: 90,
      color: COLORS.oceanMid,
      borderColor: COLORS.oceanDeep,
    },
    {
      type: "bracket",
      label: "NCB",
      w: 55,
      h: 40,
      color: COLORS.gold,
      borderColor: COLORS.oceanDeep,
    },
    {
      type: "bracket",
      label: "UPB",
      w: 60,
      h: 38,
      color: COLORS.gold,
      borderColor: COLORS.oceanDeep,
    },
    {
      type: "cap",
      label: "Pile Cap",
      w: 50,
      h: 20,
      color: COLORS.goldBright,
      borderColor: COLORS.oceanDeep,
    },
    {
      type: "bolt",
      label: "Coupling",
      w: 32,
      h: 32,
      color: COLORS.border,
      borderColor: COLORS.oceanDeep,
    },
    {
      type: "helix",
      label: '8" Helix',
      w: 44,
      h: 44,
      color: COLORS.teal,
      borderColor: COLORS.oceanDeep,
    },
    {
      type: "shaft",
      label: "SS175",
      w: 18,
      h: 80,
      color: COLORS.oceanLight,
      borderColor: COLORS.oceanDeep,
    },
    {
      type: "extension",
      label: "5' Ext",
      w: 22,
      h: 120,
      color: COLORS.oceanDeep,
      borderColor: COLORS.teal,
    },
    {
      type: "extension",
      label: "7' Ext",
      w: 22,
      h: 140,
      color: COLORS.oceanMid,
      borderColor: COLORS.teal,
    },
    {
      type: "helix",
      label: '6" Helix',
      w: 38,
      h: 38,
      color: COLORS.tealBright,
      borderColor: COLORS.oceanMid,
    },
    {
      type: "bracket",
      label: "Bracket",
      w: 48,
      h: 36,
      color: COLORS.goldBright,
      borderColor: COLORS.oceanDeep,
    },
  ];

  // ─── State ───
  var canvas, ctx;
  var objects = [];
  var gravityOn = false;
  var mouseDown = false;
  var mouseX = 0,
    mouseY = 0;
  var prevMouseX = 0,
    prevMouseY = 0;
  var grabbed = null;
  var grabOffsetX = 0,
    grabOffsetY = 0;
  var canvasWidth = 0,
    canvasHeight = 0;
  var isVisible = true;
  var animFrameId = null;
  var lastTime = 0;
  var initialized = false;

  // ─── Body Class ───
  function Body(x, y, w, h, objType) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vx = 0;
    this.vy = 0;
    this.mass = (w * h) / 1000;
    this.restitution = CONFIG.RESTITUTION;
    this.type = objType.type;
    this.label = objType.label;
    this.color = objType.color;
    this.borderColor = objType.borderColor;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.5;
    this.floatPhase = Math.random() * Math.PI * 2;
    this.floatSpeed = CONFIG.FLOAT_SPEED + Math.random() * 0.2;
    this.opacity = 0;
    this.targetOpacity = 0.85;
  }

  // ─── Initialization ───
  function init() {
    canvas = document.getElementById("physics-canvas");
    if (!canvas) return;

    ctx = canvas.getContext("2d");
    resize();
    createObjects();
    bindEvents();
    setupVisibilityObserver();
    setupGravityButton();
    lastTime = performance.now();
    loop();
    initialized = true;
  }

  function resize() {
    var hero = canvas.parentElement;
    var rect = hero.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;

    canvasWidth = rect.width;
    canvasHeight = rect.height;

    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = canvasWidth + "px";
    canvas.style.height = canvasHeight + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createObjects() {
    objects = [];
    var isMobile = window.innerWidth < 768;
    var count = isMobile ? CONFIG.MOBILE_COUNT : CONFIG.OBJECT_COUNT;
    var padding = 60;

    for (var i = 0; i < count; i++) {
      var typeIdx = i % OBJECT_TYPES.length;
      var objType = OBJECT_TYPES[typeIdx];
      var x = padding + Math.random() * (canvasWidth - padding * 2 - objType.w);
      var y =
        padding + Math.random() * (canvasHeight - padding * 2 - objType.h);

      var body = new Body(x, y, objType.w, objType.h, objType);
      body.vx = (Math.random() - 0.5) * 20;
      body.vy = (Math.random() - 0.5) * 20;

      objects.push(body);
    }
  }

  // ─── Event Binding ───
  function bindEvents() {
    window.addEventListener("resize", function () {
      resize();
      // Reposition objects that are out of bounds
      objects.forEach(function (obj) {
        if (obj.x + obj.w > canvasWidth) obj.x = canvasWidth - obj.w - 10;
        if (obj.y + obj.h > canvasHeight) obj.y = canvasHeight - obj.h - 10;
        if (obj.x < 0) obj.x = 10;
        if (obj.y < 0) obj.y = 10;
      });
    });

    // Mouse events
    canvas.addEventListener("mousedown", onPointerDown);
    canvas.addEventListener("mousemove", onPointerMove);
    canvas.addEventListener("mouseup", onPointerUp);
    canvas.addEventListener("mouseleave", onPointerUp);

    // Touch events
    canvas.addEventListener(
      "touchstart",
      function (e) {
        var touch = e.touches[0];
        var rect = canvas.getBoundingClientRect();
        onPointerDown({
          clientX: touch.clientX,
          clientY: touch.clientY,
          rect: rect,
        });
      },
      { passive: true },
    );

    canvas.addEventListener(
      "touchmove",
      function (e) {
        if (grabbed) e.preventDefault();
        var touch = e.touches[0];
        var rect = canvas.getBoundingClientRect();
        onPointerMove({
          clientX: touch.clientX,
          clientY: touch.clientY,
          rect: rect,
        });
      },
      { passive: false },
    );

    canvas.addEventListener("touchend", onPointerUp);
  }

  function onPointerDown(e) {
    var rect = e.rect || canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    mouseDown = true;

    // Find topmost object under pointer
    for (var i = objects.length - 1; i >= 0; i--) {
      var obj = objects[i];
      if (
        mouseX >= obj.x &&
        mouseX <= obj.x + obj.w &&
        mouseY >= obj.y &&
        mouseY <= obj.y + obj.h
      ) {
        grabbed = obj;
        grabOffsetX = mouseX - obj.x;
        grabOffsetY = mouseY - obj.y;
        obj.vx = 0;
        obj.vy = 0;
        // Move to front
        objects.splice(i, 1);
        objects.push(obj);
        break;
      }
    }
  }

  function onPointerMove(e) {
    var rect = e.rect || canvas.getBoundingClientRect();
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    if (grabbed) {
      grabbed.x = mouseX - grabOffsetX;
      grabbed.y = mouseY - grabOffsetY;
    }
  }

  function onPointerUp() {
    if (grabbed) {
      // Apply throw velocity
      grabbed.vx = ((mouseX - prevMouseX) * CONFIG.MOUSE_FORCE) / 60;
      grabbed.vy = ((mouseY - prevMouseY) * CONFIG.MOUSE_FORCE) / 60;
    }
    mouseDown = false;
    grabbed = null;
  }

  // ─── Visibility Observer ───
  function setupVisibilityObserver() {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          isVisible = entry.isIntersecting;
        });
      },
      { rootMargin: "100px" },
    );

    observer.observe(canvas.parentElement);
  }

  // ─── Gravity Button ───
  function setupGravityButton() {
    var gravBtn = document.getElementById("gravity-btn");
    var floatBtn = document.getElementById("float-btn");

    if (gravBtn) {
      gravBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        gravityOn = true;
        gravBtn.classList.add("active");
        gravBtn.textContent = "Gravity: ON";
        if (floatBtn) floatBtn.classList.remove("active");
      });
    }

    if (floatBtn) {
      floatBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        gravityOn = false;
        if (floatBtn) floatBtn.classList.add("active");
        if (gravBtn) {
          gravBtn.classList.remove("active");
          gravBtn.textContent = "Activate Gravity";
        }
        // Give objects upward nudge to "float" again
        objects.forEach(function (obj) {
          obj.vy = -(100 + Math.random() * 200);
          obj.vx = (Math.random() - 0.5) * 100;
        });
      });
    }
  }

  // ─── Physics Update ───
  function update(dt) {
    if (dt > 0.05) dt = 0.05; // Cap delta time

    objects.forEach(function (obj) {
      if (obj === grabbed) return;

      // Fade in
      if (obj.opacity < obj.targetOpacity) {
        obj.opacity = Math.min(obj.opacity + dt * 2, obj.targetOpacity);
      }

      if (gravityOn) {
        // Apply gravity
        obj.vy += CONFIG.GRAVITY * dt;
      } else {
        // Floating behavior — gentle oscillation
        obj.floatPhase += obj.floatSpeed * dt;
        obj.vy += Math.sin(obj.floatPhase) * CONFIG.FLOAT_AMPLITUDE * dt;
        obj.vx +=
          Math.cos(obj.floatPhase * 0.7) * CONFIG.FLOAT_AMPLITUDE * 0.5 * dt;

        // Gentle damping toward zero
        obj.vx *= 0.995;
        obj.vy *= 0.995;
      }

      // Apply velocity
      obj.x += obj.vx * dt;
      obj.y += obj.vy * dt;

      // Rotation
      if (gravityOn) {
        obj.rotationSpeed *= 0.99;
      }
      obj.rotation += obj.rotationSpeed * dt;

      // Damping
      obj.vx *= CONFIG.DAMPING;
      obj.vy *= CONFIG.DAMPING;

      // Floor collision
      if (obj.y + obj.h > canvasHeight) {
        obj.y = canvasHeight - obj.h;
        obj.vy *= -obj.restitution;
        obj.vx *= CONFIG.FRICTION;
        obj.rotationSpeed *= 0.8;
        // Stop micro-bouncing
        if (Math.abs(obj.vy) < 10) obj.vy = 0;
      }

      // Ceiling collision
      if (obj.y < 0) {
        obj.y = 0;
        obj.vy *= -obj.restitution;
      }

      // Wall collisions
      if (obj.x + obj.w > canvasWidth) {
        obj.x = canvasWidth - obj.w;
        obj.vx *= -obj.restitution;
      }
      if (obj.x < 0) {
        obj.x = 0;
        obj.vx *= -obj.restitution;
      }
    });

    // Object-to-object collisions (AABB)
    for (var i = 0; i < objects.length; i++) {
      for (var j = i + 1; j < objects.length; j++) {
        resolveCollision(objects[i], objects[j]);
      }
    }
  }

  function resolveCollision(a, b) {
    if (a === grabbed || b === grabbed) return;

    // AABB overlap test
    var overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    var overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);

    if (overlapX <= 0 || overlapY <= 0) return;

    // Separate along minimum overlap axis
    var totalMass = a.mass + b.mass;
    var restitution = Math.min(a.restitution, b.restitution);

    if (overlapX < overlapY) {
      // Horizontal separation
      var sign = a.x + a.w / 2 < b.x + b.w / 2 ? -1 : 1;
      a.x += sign * overlapX * (b.mass / totalMass);
      b.x -= sign * overlapX * (a.mass / totalMass);

      // Elastic collision response
      var relVx = a.vx - b.vx;
      var impulse = (relVx * (1 + restitution)) / totalMass;
      a.vx -= impulse * b.mass;
      b.vx += impulse * a.mass;
    } else {
      // Vertical separation
      var signY = a.y + a.h / 2 < b.y + b.h / 2 ? -1 : 1;
      a.y += signY * overlapY * (b.mass / totalMass);
      b.y -= signY * overlapY * (a.mass / totalMass);

      var relVy = a.vy - b.vy;
      var impulseY = (relVy * (1 + restitution)) / totalMass;
      a.vy -= impulseY * b.mass;
      b.vy += impulseY * a.mass;
    }
  }

  // ─── Rendering ───
  function render() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    objects.forEach(function (obj) {
      if (obj.opacity <= 0) return;

      ctx.save();
      ctx.globalAlpha = obj.opacity;

      var cx = obj.x + obj.w / 2;
      var cy = obj.y + obj.h / 2;

      ctx.translate(cx, cy);
      ctx.rotate(obj.rotation);

      switch (obj.type) {
        case "helix":
          drawHelix(obj);
          break;
        case "shaft":
        case "extension":
          drawShaft(obj);
          break;
        case "bracket":
          drawBracket(obj);
          break;
        case "cap":
          drawCap(obj);
          break;
        case "bolt":
          drawBolt(obj);
          break;
        default:
          drawRect(obj);
      }

      ctx.restore();
    });
  }

  function drawHelix(obj) {
    var r = Math.min(obj.w, obj.h) / 2;

    // Outer circle (plate)
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = obj.color;
    ctx.fill();
    ctx.strokeStyle = obj.borderColor;
    ctx.lineWidth = CONFIG.LINE_WIDTH;
    ctx.stroke();

    // Inner hub
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = obj.borderColor;
    ctx.fill();

    // Helix spiral line
    ctx.beginPath();
    ctx.moveTo(r * 0.25, 0);
    ctx.bezierCurveTo(r * 0.5, -r * 0.4, r * 0.8, -r * 0.2, r * 0.9, 0);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label
    ctx.font = CONFIG.LABEL_FONT;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (r > 22) {
      ctx.fillText(obj.label, 0, r * 0.55);
    }
  }

  function drawShaft(obj) {
    var hw = obj.w / 2;
    var hh = obj.h / 2;

    // Main shaft body
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, obj.w, obj.h, 4);
    ctx.fillStyle = obj.color;
    ctx.fill();
    ctx.strokeStyle = obj.borderColor;
    ctx.lineWidth = CONFIG.LINE_WIDTH;
    ctx.stroke();

    // Center line
    ctx.beginPath();
    ctx.moveTo(0, -hh + 8);
    ctx.lineTo(0, hh - 8);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Coupling holes at ends
    ctx.beginPath();
    ctx.arc(0, -hh + 10, 3, 0, Math.PI * 2);
    ctx.arc(0, hh - 10, 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fill();

    // Label (rotated for readability)
    if (obj.h > 60) {
      ctx.font = CONFIG.LABEL_FONT;
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.rotate(-obj.rotation); // Counter-rotate for readability
      ctx.fillText(obj.label, 0, 0);
    }
  }

  function drawBracket(obj) {
    var hw = obj.w / 2;
    var hh = obj.h / 2;

    // L-shape bracket
    ctx.beginPath();
    ctx.moveTo(-hw, -hh);
    ctx.lineTo(hw, -hh);
    ctx.lineTo(hw, hh * 0.3);
    ctx.lineTo(hw * 0.3, hh * 0.3);
    ctx.lineTo(hw * 0.3, hh);
    ctx.lineTo(-hw, hh);
    ctx.closePath();

    ctx.fillStyle = obj.color;
    ctx.fill();
    ctx.strokeStyle = obj.borderColor;
    ctx.lineWidth = CONFIG.LINE_WIDTH;
    ctx.stroke();

    // Bolt holes
    ctx.fillStyle = obj.borderColor;
    ctx.beginPath();
    ctx.arc(-hw * 0.4, -hh * 0.3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hw * 0.4, -hh * 0.3, 3, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.font = CONFIG.LABEL_FONT;
    ctx.fillStyle = obj.borderColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(obj.label, 0, -hh * 0.3);
  }

  function drawCap(obj) {
    var hw = obj.w / 2;
    var hh = obj.h / 2;

    // Flat plate
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, obj.w, obj.h, 3);
    ctx.fillStyle = obj.color;
    ctx.fill();
    ctx.strokeStyle = obj.borderColor;
    ctx.lineWidth = CONFIG.LINE_WIDTH;
    ctx.stroke();

    // Center hole
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = obj.borderColor;
    ctx.fill();

    // Label
    ctx.font = CONFIG.LABEL_FONT;
    ctx.fillStyle = obj.borderColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(obj.label, 0, hh + 4);
  }

  function drawBolt(obj) {
    var r = Math.min(obj.w, obj.h) / 2;

    // Hex shape
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var angle = (Math.PI / 3) * i - Math.PI / 6;
      var px = Math.cos(angle) * r;
      var py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    ctx.fillStyle = obj.color;
    ctx.fill();
    ctx.strokeStyle = obj.borderColor;
    ctx.lineWidth = CONFIG.LINE_WIDTH;
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(26,58,92,0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawRect(obj) {
    var hw = obj.w / 2;
    var hh = obj.h / 2;

    ctx.beginPath();
    ctx.roundRect(-hw, -hh, obj.w, obj.h, 6);
    ctx.fillStyle = obj.color;
    ctx.fill();
    ctx.strokeStyle = obj.borderColor;
    ctx.lineWidth = CONFIG.LINE_WIDTH;
    ctx.stroke();
  }

  // roundRect polyfill
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      if (typeof r === "number") r = [r, r, r, r];
      this.moveTo(x + r[0], y);
      this.lineTo(x + w - r[1], y);
      this.quadraticCurveTo(x + w, y, x + w, y + r[1]);
      this.lineTo(x + w, y + h - r[2]);
      this.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
      this.lineTo(x + r[3], y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - r[3]);
      this.lineTo(x, y + r[0]);
      this.quadraticCurveTo(x, y, x + r[0], y);
      this.closePath();
    };
  }

  // ─── Main Loop ───
  function loop() {
    animFrameId = requestAnimationFrame(loop);

    if (!isVisible) return;

    var now = performance.now();
    var dt = (now - lastTime) / 1000;
    lastTime = now;

    update(dt);
    render();
  }

  // ─── Start ───
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
