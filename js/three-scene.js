/**
 * ============================================================================
 * DIGITAL AURORA — Three.js 3D Visual Centerpiece
 * Concepts: Translucent Aurora Orb • Particle Constellation • Light Rings
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // 1. Basic checks & container
    if (typeof THREE === 'undefined') {
        console.warn('Three.js library is not detected. Falling back to CSS ambient effects.');
        return;
    }

    const container = document.getElementById('hero-canvas');
    if (!container) return;

    // WebGL capability check
    function isWebGLSupported() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && 
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }

    if (!isWebGLSupported()) {
        console.warn('WebGL is not supported in this browser. Fallback activated.');
        return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let isMobile = window.innerWidth < 860;
    let isTablet = window.innerWidth >= 860 && window.innerWidth < 1200;

    // ------------------------------------------------------------------------
    // SCENE, CAMERA & RENDERER SETUP
    // ------------------------------------------------------------------------
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 5.2;

    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Transparent canvas
    container.appendChild(renderer.domElement);

    // Interactive root group
    const sceneGroup = new THREE.Group();
    scene.add(sceneGroup);

    // Position group responsive to text composition
    function updateGroupPosition() {
        if (window.innerWidth >= 1200) {
            sceneGroup.position.set(1.4, 0, 0);
            sceneGroup.scale.set(1, 1, 1);
        } else if (window.innerWidth >= 860) {
            sceneGroup.position.set(0.9, 0, 0);
            sceneGroup.scale.set(0.9, 0.9, 0.9);
        } else {
            sceneGroup.position.set(0, -0.65, 0);
            sceneGroup.scale.set(0.75, 0.75, 0.75);
        }
    }
    updateGroupPosition();

    // Aurora Color Palette
    const colorPrimary = new THREE.Color(0x9b6dff);   // Aurora violet
    const colorSecondary = new THREE.Color(0x00e5ff); // Electric cyan
    const colorTertiary = new THREE.Color(0x64ffda);  // Soft mint
    const colorPink = new THREE.Color(0xf472b6);      // Warm pink

    // ------------------------------------------------------------------------
    // 2. MAIN ORB (Translucent Shader Icosahedron)
    // ------------------------------------------------------------------------
    const orbRadius = 1.25;
    const detail = isMobile ? 3 : 5;
    const orbGeometry = new THREE.IcosahedronGeometry(orbRadius, detail);

    const orbVertexShader = `
        uniform float time;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldNormal;

        void main() {
            vNormal = normalize(normalMatrix * normal);
            vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;

            // Multi-frequency organic surface ripples
            vec3 pos = position;
            float wave1 = sin(pos.x * 2.2 + time * 1.2) * 0.04;
            float wave2 = cos(pos.y * 2.5 + time * 0.9) * 0.04;
            float wave3 = sin(pos.z * 2.0 + time * 1.5) * 0.03;
            pos += normal * (wave1 + wave2 + wave3);

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `;

    const orbFragmentShader = `
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 color3;
        uniform float time;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldNormal;

        void main() {
            vec3 viewDir = normalize(-vPosition);
            
            // Fresnel rim lighting
            float fresnel = dot(viewDir, vNormal);
            fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
            float rim = pow(fresnel, 2.5);

            // Shifting gradient interior
            float grad = (vNormal.y + 1.0) * 0.5;
            float grad2 = (vNormal.x + 1.0) * 0.5;
            
            vec3 interiorColor = mix(color1, color2, grad);
            interiorColor = mix(interiorColor, color3, grad2 * 0.4);

            // Edge luminance glow
            vec3 finalColor = interiorColor + (vec3(1.0) * rim * 0.65);
            
            gl_FragColor = vec4(finalColor, 0.65 + rim * 0.35);
        }
    `;

    const orbMaterial = new THREE.ShaderMaterial({
        vertexShader: orbVertexShader,
        fragmentShader: orbFragmentShader,
        uniforms: {
            time: { value: 0.0 },
            color1: { value: colorPrimary },
            color2: { value: colorSecondary },
            color3: { value: colorPink }
        },
        transparent: true,
        side: THREE.DoubleSide
    });

    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    sceneGroup.add(orb);

    // Wireframe geometric shell
    const wireframeGeometry = new THREE.IcosahedronGeometry(orbRadius * 1.035, isMobile ? 2 : 3);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x9b6dff,
        wireframe: true,
        transparent: true,
        opacity: 0.12
    });
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    orb.add(wireframe);

    // ------------------------------------------------------------------------
    // 3. SURROUNDING PARTICLE CONSTELLATION
    // ------------------------------------------------------------------------
    const particleCount = isMobile ? 70 : 190;
    const particlesGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);

    const palette = [colorPrimary, colorSecondary, colorTertiary, colorPink];

    for (let i = 0; i < particleCount; i++) {
        // Spherical distribution around orb
        const r = 1.45 + Math.random() * 2.2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        particlePositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
        particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        particlePositions[i * 3 + 2] = r * Math.cos(phi);

        const col = palette[Math.floor(Math.random() * palette.length)];
        particleColors[i * 3]     = col.r;
        particleColors[i * 3 + 1] = col.g;
        particleColors[i * 3 + 2] = col.b;

        particleSizes[i] = 0.02 + Math.random() * 0.035;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

    const particleVertexShader = `
        attribute float size;
        varying vec3 vColor;
        uniform float time;

        void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            
            // Soft pulsing particle size
            float pulse = 1.0 + sin(time * 2.5 + position.x * 6.0) * 0.25;
            gl_PointSize = size * (320.0 / -mvPosition.z) * pulse;
            gl_Position = projectionMatrix * mvPosition;
        }
    `;

    const particleFragmentShader = `
        varying vec3 vColor;

        void main() {
            // Circular particle disc
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;

            // Soft gaussian-like falloff
            float alpha = smoothstep(0.5, 0.05, dist);
            gl_FragColor = vec4(vColor, alpha * 0.75);
        }
    `;

    const particlesMaterial = new THREE.ShaderMaterial({
        vertexShader: particleVertexShader,
        fragmentShader: particleFragmentShader,
        uniforms: {
            time: { value: 0.0 }
        },
        transparent: true,
        vertexColors: true,
        depthWrite: false
    });

    const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
    sceneGroup.add(particleSystem);

    // ------------------------------------------------------------------------
    // 4. LIGHT RINGS
    // ------------------------------------------------------------------------
    function createRing(radius, tube, color, opacity, rotX, rotY) {
        const ringGeo = new THREE.TorusGeometry(radius, tube, 8, 80);
        const ringMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: opacity
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = rotX;
        ring.rotation.y = rotY;
        sceneGroup.add(ring);
        return ring;
    }

    const ring1 = createRing(1.85, 0.006, colorSecondary, 0.24, Math.PI / 3, Math.PI / 6);
    const ring2 = createRing(2.15, 0.005, colorPrimary, 0.18, -Math.PI / 4, Math.PI / 4);
    const ring3 = createRing(2.45, 0.004, colorTertiary, 0.15, Math.PI / 2.2, 0);

    // ------------------------------------------------------------------------
    // 5. FLOATING GEOMETRIC OBJECTS
    // ------------------------------------------------------------------------
    const floaters = [];
    const floaterGeos = [
        new THREE.OctahedronGeometry(0.08),
        new THREE.TetrahedronGeometry(0.09),
        new THREE.BoxGeometry(0.07, 0.07, 0.07),
        new THREE.OctahedronGeometry(0.07)
    ];

    const floaterCount = isMobile ? 3 : 5;
    for (let i = 0; i < floaterCount; i++) {
        const geo = floaterGeos[i % floaterGeos.length];
        const mat = new THREE.MeshBasicMaterial({
            color: palette[i % palette.length],
            wireframe: true,
            transparent: true,
            opacity: 0.4
        });
        const mesh = new THREE.Mesh(geo, mat);
        sceneGroup.add(mesh);

        floaters.push({
            mesh: mesh,
            radius: 1.6 + i * 0.35,
            speed: 0.4 + i * 0.15,
            angle: (i / floaterCount) * Math.PI * 2,
            offsetY: (Math.random() - 0.5) * 1.2
        });
    }

    // ------------------------------------------------------------------------
    // 6. LIGHTING
    // ------------------------------------------------------------------------
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(colorPrimary, 1.8, 12);
    pointLight1.position.set(4, 4, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(colorSecondary, 1.4, 12);
    pointLight2.position.set(-4, -3, 2);
    scene.add(pointLight2);

    // ------------------------------------------------------------------------
    // 7. MOUSE PARALLAX TRACKING
    // ------------------------------------------------------------------------
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - windowHalfX) / windowHalfX;
        mouseY = (e.clientY - windowHalfY) / windowHalfY;
    }, { passive: true });

    // Window Resize Handling
    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        isMobile = width < 860;
        isTablet = width >= 860 && width < 1200;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        updateGroupPosition();
    }, { passive: true });

    // ------------------------------------------------------------------------
    // 8. ANIMATION LOOP & VIEWPORT VISIBILITY OBSERVER
    // ------------------------------------------------------------------------
    const clock = new THREE.Clock();
    let isVisible = true;

    // Pause rendering when hero is outside viewport to save battery/GPU
    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            isVisible = entry.isIntersecting;
        });
    }, { threshold: 0.05 });

    heroObserver.observe(container);

    function animate() {
        requestAnimationFrame(animate);

        if (!isVisible) return;

        const delta = clock.getDelta();
        const time = clock.getElapsedTime();
        const speedMultiplier = prefersReducedMotion ? 0.25 : 1.0;

        // Smooth mouse orientation follow
        targetX = mouseX * 0.28;
        targetY = mouseY * 0.28;

        sceneGroup.rotation.y += (targetX - sceneGroup.rotation.y) * 0.05;
        sceneGroup.rotation.x += (targetY - sceneGroup.rotation.x) * 0.05;

        // Orb rotation & breathing waves
        orb.rotation.x += 0.002 * speedMultiplier;
        orb.rotation.y += 0.0035 * speedMultiplier;
        orb.rotation.z += 0.001 * speedMultiplier;
        orbMaterial.uniforms.time.value = time * speedMultiplier;

        // Particle field rotation & pulse
        particleSystem.rotation.y -= 0.0015 * speedMultiplier;
        particleSystem.rotation.x -= 0.001 * speedMultiplier;
        particlesMaterial.uniforms.time.value = time * speedMultiplier;

        // Light rings rotation
        ring1.rotation.z += 0.003 * speedMultiplier;
        ring2.rotation.z -= 0.0025 * speedMultiplier;
        ring3.rotation.z += 0.0035 * speedMultiplier;

        // Orbiting floaters
        floaters.forEach((f) => {
            f.angle += f.speed * delta * speedMultiplier;
            f.mesh.position.x = Math.cos(f.angle) * f.radius;
            f.mesh.position.z = Math.sin(f.angle) * f.radius;
            f.mesh.position.y = f.offsetY + Math.sin(time * f.speed + f.radius) * 0.15;

            f.mesh.rotation.x += 0.015 * speedMultiplier;
            f.mesh.rotation.y += 0.025 * speedMultiplier;
        });

        renderer.render(scene, camera);
    }

    animate();
});
