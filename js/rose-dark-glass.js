import * as THREE from "three";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function initRoseDarkGlass(container) {
  const el = container;
  const firstRect = el.getBoundingClientRect?.() ?? { width: 0, height: 0 };
  const W = el.clientWidth || firstRect.width || 640;
  const H = el.clientHeight || firstRect.height || 640;

  const reduceMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const roseWrap = el.closest?.(".hero-rose") ?? null;
  if (roseWrap) {
    document.body.classList.add("rose-follow-enabled");
    roseWrap.dataset.side = "right";
    roseWrap.style.setProperty("--rose-scale", "1");
    roseWrap.style.setProperty("--rose-tilt", "-6deg");

    // Ensure the fixed rose isn't clipped by `#hero { overflow: hidden; }`
    // by moving it to be a direct child of <body>.
    if (roseWrap.parentElement !== document.body) {
      document.body.appendChild(roseWrap);
    }

    // (debug visuals removed)
  }

  // ── Renderer ──────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  el.appendChild(renderer.domElement);

  // ── Scene / Camera ────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0005, 0.055);
  const camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 100);
  // Keep the full bloom + stem in frame across sections.
  camera.position.set(0, 1.05, 6.2);
  camera.lookAt(0, -0.95, 0);

  // ── Env map bake ──────────────────────────────────────────────────────────
  const cubeRT = new THREE.WebGLCubeRenderTarget(256, {
    format: THREE.RGBFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
  });
  const cubeCamera = new THREE.CubeCamera(0.1, 50, cubeRT);
  scene.add(cubeCamera);

  const envSphere = new THREE.Mesh(
    new THREE.SphereGeometry(30, 24, 14),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        uTop: { value: new THREE.Color(0x1a0008) },
        uMid: { value: new THREE.Color(0x300010) },
        uBot: { value: new THREE.Color(0x080003) },
      },
      vertexShader:
        "varying float vY; void main(){ vY=position.y; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader:
        "uniform vec3 uTop,uMid,uBot; varying float vY; void main(){ float t=clamp(vY/30.,0.,1.); vec3 c=mix(uBot,uMid,smoothstep(0.,.5,t)); c=mix(c,uTop,smoothstep(.5,1.,t)); gl_FragColor=vec4(c,1.);} ",
    })
  );
  envSphere.visible = false;
  scene.add(envSphere);
  let envBaked = false;

  // ── Lights ────────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xff1020, 0.15));

  const key = new THREE.DirectionalLight(0xfff0ee, 4.0);
  key.position.set(-2, 5, 4);
  key.castShadow = true;
  key.shadow.mapSize.width = key.shadow.mapSize.height = 1024;
  key.shadow.bias = -0.001;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xff3300, 1.8);
  rim.position.set(2, 2, -4);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0xff8866, 0.6);
  fill.position.set(3, 1, 3);
  scene.add(fill);

  const under = new THREE.PointLight(0xff0010, 1.2, 6);
  under.position.set(0, -1.5, 0.5);
  scene.add(under);

  // ── Glass petal material ──────────────────────────────────────────────────
  const petalMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x8b0000),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.82,
    roughness: 0.05,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMapIntensity: 2.5,
    depthWrite: false,
  });

  // ── Petal geometry ────────────────────────────────────────────────────────
  function makePetalGeo(width, height, cup, curl, roll) {
    const US = 30,
      VS = 40,
      stride = US + 1;
    const pos = [];
    const uv = [];
    const idx = [];

    for (let vi = 0; vi <= VS; vi++) {
      const v = vi / VS;
      const env = Math.pow(Math.sin(v * Math.PI), 0.6) * (1 - Math.pow(v, 3) * 0.3);
      const hw = (width / 2) * env;

      for (let ui = 0; ui <= US; ui++) {
        const u = ui / US;
        const uc = u - 0.5;

        const x = uc * hw * 2;
        const y = v * height;

        const cupAmt = cup * (1 - Math.pow(uc * 2, 2)) * Math.sin(v * Math.PI * 0.9);
        const curlAmt = curl * Math.pow(v, 3) * (1 - Math.pow(uc * 2, 2));
        const edgeAmt = roll * Math.pow(Math.abs(uc) * 2, 2.2) * Math.sin(v * Math.PI);

        pos.push(x, y, cupAmt + curlAmt - edgeAmt);
        uv.push(u, v);
      }
    }

    for (let vi = 0; vi < VS; vi++) {
      for (let ui = 0; ui < US; ui++) {
        const a = vi * stride + ui;
        idx.push(a, a + stride, a + 1, a + 1, a + stride, a + stride + 1);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }

  // ── Rose group ────────────────────────────────────────────────────────────
  const rose = new THREE.Group();
  scene.add(rose);
  const GOLDEN = Math.PI * (3 - Math.sqrt(5));

  // Build layers: golden-angle index i still gives organic spiral spacing.
  const petalDefs = [];
  const addLayer = (count, base) => {
    for (let k = 0; k < count; k++) petalDefs.push({ ...base });
  };
  // Inner — tight bud
  addLayer(5, { w: 0.37, h: 0.69, cup: 0.1, curl: -0.08, roll: 0.042, r: 0.0, yo: 0.0, splay: 0.1 });
  // Mid — opening
  addLayer(6, { w: 0.53, h: 0.77, cup: 0.14, curl: -0.05, roll: 0.062, r: 0.012, yo: 0.0, splay: 0.28 });
  // Outer — main cup
  addLayer(8, { w: 0.69, h: 0.82, cup: 0.18, curl: 0.02, roll: 0.09, r: 0.022, yo: 0.0, splay: 0.49 });
  // Outermost — lighter, wider splay (fills gaps between big petals)
  addLayer(5, { w: 0.61, h: 0.73, cup: 0.14, curl: 0.04, roll: 0.085, r: 0.034, yo: 0.016, splay: 0.56 });

  petalDefs.forEach(({ w, h, cup, curl, roll, r, yo, splay }, i) => {
    const angle = i * GOLDEN;
    const geo = makePetalGeo(w, h, cup, curl, roll);
    const pivot = new THREE.Group();

    const mesh = new THREE.Mesh(geo, petalMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    pivot.add(mesh);

    pivot.rotation.x = splay;

    const outer = new THREE.Group();
    outer.add(pivot);
    outer.position.set(Math.sin(angle) * r, yo, Math.cos(angle) * r);
    outer.rotation.y = angle;
    rose.add(outer);
  });

  // Base knob
  const sepalMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a4a08,
    roughness: 0.6,
    clearcoat: 0.3,
    envMapIntensity: 0.4,
  });
  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    sepalMat
  );
  knob.position.set(0, -0.02, 0);
  rose.add(knob);

  // Stem
  const stemMat = new THREE.MeshPhysicalMaterial({ color: 0x1e5c0a, roughness: 0.7, clearcoat: 0.2 });
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.0, 0),
    new THREE.Vector3(0.04, -0.38, 0.02),
    new THREE.Vector3(-0.03, -0.95, 0.015),
    new THREE.Vector3(0.025, -1.55, 0.008),
    new THREE.Vector3(-0.02, -2.1, 0.012),
    new THREE.Vector3(0.018, -2.72, 0),
    new THREE.Vector3(-0.012, -3.25, -0.01),
  ]);
  rose.add(new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 72, 0.022, 8, false), stemMat));

  function addLeaf(x, y, z, ry, rz) {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(-0.08, 0.06, -0.1, 0.2, 0, 0.3);
    s.bezierCurveTo(0.08, 0.2, 0.1, 0.06, 0, 0);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.004, bevelEnabled: false, curveSegments: 12 });
    geo.center();
    const m = new THREE.Mesh(
      geo,
      new THREE.MeshPhysicalMaterial({
        color: 0x2a7010,
        side: THREE.DoubleSide,
        roughness: 0.5,
        clearcoat: 0.4,
        envMapIntensity: 0.5,
      })
    );
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.rotation.z = rz;
    rose.add(m);
  }
  addLeaf(0.08, -0.5, 0.04, 0.4, -0.55);
  addLeaf(-0.07, -1.12, -0.03, -0.5, 0.5);

  // ── Interaction: drag to rotate + hover parallax ──────────────────────────
  let drag = false,
    lx = 0,
    ly = 0,
    rotY = 0,
    rotX = 0;

  let targetRotY = 0,
    targetRotX = 0;
  let mouseNX = 0,
    mouseNY = 0;
  let lastCX = (typeof window !== "undefined" ? window.innerWidth : 1) * 0.5,
    lastCY = (typeof window !== "undefined" ? window.innerHeight : 1) * 0.5;
  let hovered = false;

  // Smoothed camera (hover “peek” into top of bloom — same lerp feel as the rose)
  let camY = 1.05,
    lookY = -0.95;
  let roseYSink = 0;
  let scrollY = typeof window !== "undefined" ? window.scrollY || 0 : 0;

  // Scroll companion motion state.
  let followY = 0;
  let wrapX = 0;
  let tiltDeg = -8;
  let activeSectionIdx = 0;

  // Subtle scene "fall" so it always feels weighty.
  let fallOffset = 0;
  let fallVel = 0;

  // Pull-down interaction (smooth, no overshoot).
  let pullY = 0;
  let pullTarget = 0;

  let lastScrollForDrift = typeof window !== "undefined" ? window.scrollY || 0 : 0;
  const heroSection =
    typeof document !== "undefined" ? document.getElementById("hero") : null;

  const followSections =
    typeof document !== "undefined"
      ? [
          document.getElementById("hero"),
          document.getElementById("about"),
          document.getElementById("pillars-values"),
          document.getElementById("diversity"),
          document.getElementById("lineage"),
          document.getElementById("events"),
          document.getElementById("portal"),
        ].filter(Boolean)
      : [];

  const sectionSide = (sec) => {
    if (!sec) return "right";
    if (sec.classList?.contains("rose-slot-left")) return "left";
    if (sec.classList?.contains("rose-slot-right")) return "right";
    return "right";
  };

  const docTop = (node) => {
    if (!node?.getBoundingClientRect) return 0;
    const r = node.getBoundingClientRect();
    return (window.scrollY || 0) + r.top;
  };

  let sectionTops = [];
  const updateSectionTops = () => {
    sectionTops = followSections.map((s) => docTop(s));
  };
  if (typeof window !== "undefined") {
    updateSectionTops();
  }

  const down = (e) => {
    drag = true;
    lx = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    ly = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    renderer.domElement.classList.add("is-dragging");
  };
  const up = () => {
    drag = false;
    renderer.domElement.classList.remove("is-dragging");
  };
  const move = (e) => {
    const cx = e.clientX ?? e.touches?.[0]?.clientX;
    const cy = e.clientY ?? e.touches?.[0]?.clientY;
    if (cx == null || cy == null) return;

    if (drag) {
      rotY += (cx - lx) * 0.008;
      rotX = clamp(rotX + (cy - ly) * 0.006, -0.6, 0.6);
      lx = cx;
      ly = cy;
    }

    const iw = window.innerWidth || 1;
    const ih = window.innerHeight || 1;
    mouseNX = (cx / iw) * 2 - 1;
    mouseNY = (cy / ih) * 2 - 1;
    lastCX = cx;
    lastCY = cy;
  };

  renderer.domElement.addEventListener("mousedown", down);
  window.addEventListener("mouseup", up);
  window.addEventListener("mousemove", move);
  renderer.domElement.addEventListener("touchstart", down, { passive: true });
  window.addEventListener("touchend", up);
  window.addEventListener("touchmove", move, { passive: true });
  renderer.domElement.addEventListener("pointerenter", () => {
    hovered = true;
  });
  renderer.domElement.addEventListener("pointerleave", () => {
    hovered = false;
  });

  const onScroll = () => {
    scrollY = window.scrollY || 0;
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  // ── Animate ───────────────────────────────────────────────────────────────
  const clock = new THREE.Clock();
  let raf = 0;

  function tick() {
    raf = requestAnimationFrame(tick);
    const t = clock.getElapsedTime();

    if (!envBaked && t > 0.06) {
      envSphere.visible = true;
      cubeCamera.update(renderer, scene);
      scene.traverse((obj) => {
        if (obj && obj.isMesh && obj.material && obj.material.isMeshPhysicalMaterial) {
          obj.material.envMap = cubeRT.texture;
          obj.material.needsUpdate = true;
        }
      });
      envSphere.visible = false;
      envBaked = true;
    }

    // Slow constant spin on its vertical axis.
    if (!drag) rotY += hovered ? 0.0048 : 0.0036;

    const kRoseLerp = drag ? 0.065 : 0.092;
    const kCamLerp = drag ? 0.055 : 0.078;

    const rr = el.getBoundingClientRect();
    const overRose =
      lastCX >= rr.left &&
      lastCX <= rr.right &&
      lastCY >= rr.top &&
      lastCY <= rr.bottom;

    // Invisible vertical midline: hover parallax only when cursor is in the right half
    // (left half = no reaction, so hero copy can be used without moving the rose).
    const winW = window.innerWidth || 1;
    const midX = winW * 0.5;
    const inRoseZone = lastCX >= midX;
    const mx = inRoseZone ? mouseNX : 0;
    const my = inRoseZone ? mouseNY : 0;

    const VIEW_X_BIAS = 0.08;

    if (!drag) {
      // Gentle hover parallax; small “top peek” only — default pose stays natural
      let localNX = 0,
        localNY = 0;
      if (overRose && inRoseZone) {
        const w = Math.max(1, rr.width);
        const h = Math.max(1, rr.height);
        localNX = ((lastCX - rr.left) / w) * 2 - 1;
        localNY = ((lastCY - rr.top) / h) * 2 - 1;
      }

      targetRotY = rotY + mx * 0.48 + (overRose && inRoseZone ? localNX * 0.22 : 0);

      const topRevealScreen = Math.pow(Math.max(0, -my), 1.05) * 0.42;
      const topRevealLocal =
        overRose && inRoseZone ? Math.pow(Math.max(0, -localNY), 1.0) * 0.22 : 0;
      const topReveal = clamp(topRevealScreen + topRevealLocal, 0, 0.75);

      targetRotX = clamp(
        VIEW_X_BIAS + my * 0.14 - topReveal * 0.16 + (overRose && inRoseZone ? localNY * 0.04 : 0),
        -0.42,
        0.48
      );

      const targetCamY = 1.05 - my * 0.12 + (overRose && inRoseZone ? -localNY * 0.08 : 0);
      const targetLookY = -0.95 + my * 0.04 + (overRose && inRoseZone ? -localNY * 0.04 : 0);
      camY += (targetCamY - camY) * kCamLerp;
      lookY += (targetLookY - lookY) * kCamLerp;
    } else {
      targetRotY = rotY;
      targetRotX = rotX;
      const targetCamY = 1.05;
      const targetLookY = -0.95;
      camY += (targetCamY - camY) * kCamLerp;
      lookY += (targetLookY - lookY) * kCamLerp;
    }

    const hoverActive = !drag && hovered;

    camera.position.y = camY;
    camera.lookAt(0, lookY, 0);

    rose.rotation.y += (targetRotY - rose.rotation.y) * kRoseLerp;
    rose.rotation.x += (targetRotX - rose.rotation.x) * kRoseLerp;

    const vh = window.innerHeight || 800;
    const vw = window.innerWidth || 1200;

    if (!reduceMotion && roseWrap && followSections.length && vw > 980) {
      const y = window.scrollY || 0;
      const doc = document.documentElement;

      // Determine current section from precomputed tops (stable order; no sorting).
      const n = followSections.length;
      let idx = 0;
      if (n >= 2) {
        for (let i = 0; i < n - 1; i++) {
          const a = sectionTops[i] ?? docTop(followSections[i]);
          const b = sectionTops[i + 1] ?? docTop(followSections[i + 1]);
          if (y >= a && y < b) {
            idx = i;
            break;
          }
          if (y >= b) idx = i + 1;
        }
      }
      activeSectionIdx = idx;
      const cur = followSections[Math.min(n - 1, idx)];
      const next = followSections[Math.min(n - 1, idx + 1)];

      const contentEl = cur?.querySelector?.(".inner") || cur;
      const curRect = contentEl?.getBoundingClientRect?.() ?? { top: 0, height: vh };
      const wrapRect0 = roseWrap.getBoundingClientRect();
      const wrapH = roseWrap.offsetHeight || wrapRect0.height || 600;
      const baseTopPx = 84; // keep in sync with `.hero-rose { top: 84px; }`

      const anchorFor = (id) => {
        switch (id) {
          case "hero":
            return 0.32;
          case "about":
            return 0.34;
          case "pillars-values":
            return 0.30;
          case "diversity":
            return 0.32;
          case "lineage":
            return 0.30;
          case "events":
            return 0.34;
          case "portal":
            return 0.52;
          default:
            return 0.34;
        }
      };

      const desiredViewportY = curRect.top + curRect.height * anchorFor(cur?.id);
      const targetFollowY = clamp(desiredViewportY - baseTopPx - wrapH * 0.42 + 24, -220, 320);
      followY += (targetFollowY - followY) * 0.075;
      roseWrap.style.setProperty("--rose-follow-y", `${followY.toFixed(2)}px`);

      const heroH = heroSection?.getBoundingClientRect?.().height || vh;
      const heroProg = clamp((y || 0) / Math.max(1, heroH * 0.9), 0, 1);
      let scale = 1.12 - heroProg * 0.18;
      const heroDropPx = (1 - heroProg) * 300;

      // Section checkpoint blending.
      const curTop = sectionTops[idx] ?? docTop(cur);
      const nextTop = sectionTops[Math.min(n - 1, idx + 1)] ?? docTop(next);
      const span = Math.max(240, nextTop - curTop);
      const within = clamp((y - curTop) / span, 0, 1);
      const blend = smoothstep(within);

      const scaleBoost =
        cur?.id === "pillars-values"
          ? lerp(1, 1.22, blend)
          : next?.id === "pillars-values"
            ? lerp(1, 1.22, blend)
            : 1;
      scale *= scaleBoost;

      roseWrap.style.setProperty("--rose-scale", `${scale.toFixed(3)}`);
      roseWrap.style.setProperty("--rose-hero-drop", `${heroDropPx.toFixed(1)}px`);

      // Side-to-side motion with non-overshooting smoothing (no jiggle).
      const curSide = sectionSide(cur);
      const nextSide = sectionSide(next);
      const marginPx = 28;
      const leftShiftPx = -(vw - wrapRect0.width - marginPx * 2);
      const sideToWrapPx = (side) => (side === "left" ? leftShiftPx : 0);
      const targetWrapX = lerp(sideToWrapPx(curSide), sideToWrapPx(nextSide), blend);

      const scrollDelta = clamp((y - lastScrollForDrift) / 240, -1, 1);
      lastScrollForDrift = y;
      const alphaBase = clamp(0.055 + Math.abs(scrollDelta) * 0.075, 0.05, 0.14);
      const alpha =
        cur?.id === "pillars-values" || next?.id === "pillars-values" ? alphaBase * 0.62 : alphaBase;
      wrapX += (targetWrapX - wrapX) * alpha;
      wrapX = clamp(wrapX, leftShiftPx, 0);
      roseWrap.style.setProperty("--rose-x", `${wrapX.toFixed(2)}px`);

      const norm = leftShiftPx ? clamp(wrapX / leftShiftPx, 0, 1) : 0;
      const sideCounterLean = norm > 0.5 ? 3.0 : -3.0;
      const depthTilt = clamp((idx / Math.max(1, n - 1)) * 6, 0, 6);
      const targetTilt = clamp(
        -12 + (norm - 0.5) * 22 + (idx % 2 === 0 ? -2 : 2) + sideCounterLean + depthTilt,
        -24,
        24
      );
      tiltDeg += (targetTilt - tiltDeg) * 0.07;
      roseWrap.style.setProperty("--rose-tilt", `${tiltDeg.toFixed(2)}deg`);
    } else if (roseWrap) {
      roseWrap.style.setProperty("--rose-scale", "1");
      roseWrap.style.setProperty("--rose-tilt", "-8deg");
      roseWrap.style.setProperty("--rose-hero-drop", "0px");
      roseWrap.style.setProperty("--rose-x", "0px");
      wrapX = 0;
    }

    // Subtle "fall" in scene-space (kept small so stem stays visible).
    if (!reduceMotion) {
      const doc = document.documentElement;
      const scrollMax = Math.max(1, (doc?.scrollHeight || 1) - vh);
      const prog = clamp((window.scrollY || 0) / scrollMax, 0, 1);
      const eased = 1 - Math.pow(1 - prog, 2.2);
      const targetFall = eased * 0.22;
      fallVel += (targetFall - fallOffset) * (0.06 * 0.22);
      fallVel *= 0.78;
      fallVel += 0.0018;
      fallOffset += fallVel;
    }

    // Pull-down / hover interaction: smooth only, no bounce.
    pullTarget = hoverActive ? 0.08 : 0;
    pullY += (pullTarget - pullY) * 0.22;

    roseYSink += (0 - roseYSink) * 0.12;
    rose.position.x = 0;
    rose.position.y = -0.02 - roseYSink - fallOffset - pullY;

    // No bob/roll light wobble.
    rose.rotation.z = 0;
    under.intensity = 1.0;

    renderer.render(scene, camera);
  }
  tick();

  // ── Resize ────────────────────────────────────────────────────────────────
  const onResize = () => {
    const w = el.clientWidth;
    const h = el.clientHeight;
    const rw = w || el.getBoundingClientRect?.().width || 640;
    const rh = h || el.getBoundingClientRect?.().height || 640;
    camera.aspect = rw / rh;
    camera.updateProjectionMatrix();
    renderer.setSize(rw, rh);
    updateSectionTops();
  };
  window.addEventListener("resize", onResize);
  // Run once after styles/layout settle.
  queueMicrotask?.(onResize);
  window.setTimeout(onResize, 0);

  // Cleanup
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("mouseup", up);
    window.removeEventListener("mousemove", move);
    window.removeEventListener("touchend", up);
    window.removeEventListener("touchmove", move);
    renderer.domElement.removeEventListener("mousedown", down);
    renderer.domElement.removeEventListener("touchstart", down);
    renderer.dispose();
    cubeRT.dispose();
    petalMat.dispose();
    sepalMat.dispose();
    stemMat.dispose();
    scene.traverse((obj) => {
      if (obj && obj.isMesh) {
        if (obj.geometry) obj.geometry.dispose?.();
        if (obj.material && obj.material.dispose) obj.material.dispose();
      }
    });
    if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
  };
}

// Auto-mount. If the page doesn't include the rose markup, create it so
// the scroll-companion behavior can't silently disappear.
let mount = document.getElementById("rose3d");
if (!mount && typeof document !== "undefined") {
  const wrap = document.createElement("div");
  wrap.className = "hero-rose";
  wrap.setAttribute("aria-hidden", "true");

  mount = document.createElement("div");
  mount.className = "hero-rose__mount";
  mount.id = "rose3d";

  wrap.appendChild(mount);
  document.body?.appendChild(wrap);
}

if (mount) {
  const cleanup = initRoseDarkGlass(mount);
  window.addEventListener("pagehide", cleanup, { once: true });
}

