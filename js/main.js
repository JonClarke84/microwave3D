// main.js

// Import necessary components from three.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Ensure the script runs after the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0e6d6); // Warm background

    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add OrbitControls for camera manipulation (optional)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Kitchen Environment - simple floor and walls
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = - Math.PI / 2;
    scene.add(floor);

    // Add simple walls
    const wallGeometry = new THREE.PlaneGeometry(20, 10);
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xffe4c4 });

    const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    backWall.position.z = -10;
    backWall.position.y = 5;
    scene.add(backWall);

    const frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
    frontWall.position.z = 10;
    frontWall.rotation.y = Math.PI;
    frontWall.position.y = 5;
    scene.add(frontWall);

    // Microwave
    let microwave;
    const microwaveWidth = 2;
    const microwaveHeight = 1.5;
    const microwaveDepth = 1;

    const microwaveGeometry = new THREE.BoxGeometry(microwaveWidth, microwaveHeight, microwaveDepth);
    const microwaveMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    microwave = new THREE.Mesh(microwaveGeometry, microwaveMaterial);
    microwave.position.set(0, microwaveHeight / 2, 0);
    scene.add(microwave);

    // Microwave door
    const doorGeometry = new THREE.PlaneGeometry(microwaveWidth - 0.1, microwaveHeight - 0.2);
    const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x444444, side: THREE.DoubleSide });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 0, microwaveDepth / 2 + 0.01);
    microwave.add(door);

    // Microwave window
    const windowGeometry = new THREE.PlaneGeometry(1.2, 0.8);
    const windowMaterial = new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.8 });
    const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
    windowMesh.position.set(0, 0.2, 0.01);
    door.add(windowMesh);

    // Food inside microwave
    const foodGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.3);
    const foodMaterial = new THREE.MeshLambertMaterial({ color: 0xb5651d });
    const food = new THREE.Mesh(foodGeometry, foodMaterial);
    food.position.set(0, 0, 0.05);
    windowMesh.add(food);

    // Timer Display - using canvas texture
    function createTimerTexture(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = '32px Press Start 2P';
        ctx.fillStyle = '#0f0';
        ctx.textAlign = 'center';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 10);
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    const timerInitialText = "00:30.000";
    const timerTexture = createTimerTexture(timerInitialText);
    const timerMaterial = new THREE.MeshBasicMaterial({ map: timerTexture, transparent: true });
    const timerGeometry = new THREE.PlaneGeometry(1, 0.3);
    const timerMesh = new THREE.Mesh(timerGeometry, timerMaterial);
    timerMesh.position.set(0, -0.3, 0.02);
    door.add(timerMesh);

    // Timer Selection UI is handled via HTML controls

    // Variables for timer
    let timerDuration = 30000; // default 30 seconds
    let timerStartTime = null;
    let timerInterval = null;
    let timerRunning = false;
    let remainingTime = timerDuration;
    let timerEnded = false;

    // HTML Elements
    const timerSelect = document.getElementById('timerSelect');
    const goButton = document.getElementById('goButton');
    const openButton = document.getElementById('openButton');
    const dialog = document.getElementById('dialog');
    const dialogText = document.getElementById('dialogText');
    const closeButton = document.getElementById('closeButton');

    // Event Listeners
    goButton.addEventListener('click', startTimer);
    openButton.addEventListener('click', openMicrowave);
    closeButton.addEventListener('click', () => {
        dialog.style.display = "none";
    });

    window.addEventListener('click', (event) => {
        if (event.target == dialog) {
            dialog.style.display = "none";
        }
    });

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    function onWindowResize(){
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Camera positioning
    camera.position.set(5, 5, 10);
    controls.update();

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);

        controls.update();

        // Rotate the food if timer is running
        if (timerRunning && !timerEnded) {
            food.rotation.y += 0.05;
        }

        // Update the timer
        if (timerRunning && !timerEnded) {
            const elapsed = Date.now() - timerStartTime;
            remainingTime = timerDuration - elapsed;

            if (remainingTime <= 0) {
                remainingTime = 0;
                timerRunning = false;
                timerEnded = true;
                updateTimerDisplay("00:00.000");
                showDingDialog();
            } else {
                updateTimerDisplay(formatTime(remainingTime));
            }
        }

        renderer.render(scene, camera);
    }

    animate();

    // Start the timer
    function startTimer() {
        if (timerRunning) return; // prevent multiple timers

        // Get the selected timer value
        timerDuration = parseInt(timerSelect.value);
        remainingTime = timerDuration;
        timerStartTime = Date.now();
        timerRunning = true;
        timerEnded = false;
        // Reset food rotation
        food.rotation.y = 0;
    }

    // Open button logic
    function openMicrowave() {
        if (!timerRunning && !timerEnded) {
            // Timer hasn't started yet
            return;
        }

        // Calculate remaining time if timer is running
        if (timerRunning) {
            remainingTime = timerDuration - (Date.now() - timerStartTime);
            if (remainingTime < 0) remainingTime = 0;
            timerRunning = false;
        }

        const timeText = formatTime(remainingTime);
        dialogText.textContent = `Time left: ${timeText}`;
        dialog.style.display = "block";
    }

    // Show "Ding!" dialog when timer ends
    function showDingDialog() {
        dialogText.textContent = "Ding! Your food is ready!";
        dialog.style.display = "block";
    }

    // Update the timer display on the microwave
    function updateTimerDisplay(text) {
        timerMesh.material.map = createTimerTexture(text);
        timerMesh.material.map.needsUpdate = true;
    }

    // Format time in mm:ss.mmm
    function formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = ms % 1000;
        return `${padZero(minutes)}:${padZero(seconds)}.${padZero(milliseconds, 3)}`;
    }

    // Helper function to pad numbers with leading zeros
    function padZero(num, size = 2) {
        let s = num.toString();
        while (s.length < size) s = "0" + s;
        return s;
    }

});
