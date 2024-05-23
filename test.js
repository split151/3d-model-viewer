import * as THREE from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

let scene, camera, renderer, controls, model;
const sizes = { width: window.innerWidth, height: window.innerHeight };
const modelPath = '/Floor_cable_cover.gltf'; // Path to the model to be displayed

// Initialization function to set up the scene, camera, renderer, and controls
function init() {
  // Create a Three.js scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff); // Set the background color to white

  // Set up the renderer
  const canvas = document.querySelector('.webgl');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true; // Enable shadow mapping

  // Set up the camera
  const aspect = sizes.width / sizes.height;
  const frustumSize = 10;
  camera = new THREE.OrthographicCamera(
    frustumSize * aspect / -2,
    frustumSize * aspect / 2,
    frustumSize / 2,
    frustumSize / -2,
    0.1,
    1000
  );
  scene.add(camera);

  // Set up the controls
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.autoRotate = false;
  controls.minAzimuthAngle = -Infinity; // Allow full horizontal rotation
  controls.maxAzimuthAngle = Infinity;
  controls.minPolarAngle = 0; // Allow full vertical rotation
  controls.maxPolarAngle = Math.PI;

  // Set up lights
  setupLights();

  // Handle window resize
  window.addEventListener('resize', onWindowResize);

  // Set up the environment map
  const environment = new RoomEnvironment();
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(environment).texture;

  // Set tone mapping and output encoding
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  renderer.outputEncoding = THREE.sRGBEncoding;

  // Load the model
  loadModel(modelPath);
}

// Function to set up lights
function setupLights() {
  const ambientLight = new THREE.AmbientLight(0x404040, 5); // soft white light
  scene.add(ambientLight);

  const frontDirectionalLight = new THREE.DirectionalLight(0xffffff, 3); // White directional light for the front
  frontDirectionalLight.position.set(0, 20, 20);
  frontDirectionalLight.castShadow = true; // Enable shadow casting
  frontDirectionalLight.shadow.mapSize.width = 2048; // High resolution shadow map
  frontDirectionalLight.shadow.mapSize.height = 2048;
  frontDirectionalLight.shadow.camera.left = -50;
  frontDirectionalLight.shadow.camera.right = 50;
  frontDirectionalLight.shadow.camera.top = 50;
  frontDirectionalLight.shadow.camera.bottom = -50;
  frontDirectionalLight.shadow.camera.near = 1;
  frontDirectionalLight.shadow.camera.far = 100;
  scene.add(frontDirectionalLight);

  const backDirectionalLight = new THREE.DirectionalLight(0xffffff, 3); // White directional light for the back
  backDirectionalLight.position.set(0, 20, -20);
  backDirectionalLight.castShadow = true; // Enable shadow casting
  backDirectionalLight.shadow.mapSize.width = 2048; // High resolution shadow map
  backDirectionalLight.shadow.mapSize.height = 2048;
  backDirectionalLight.shadow.camera.left = -50;
  backDirectionalLight.shadow.camera.right = 50;
  backDirectionalLight.shadow.camera.top = 50;
  backDirectionalLight.shadow.camera.bottom = -50;
  backDirectionalLight.shadow.camera.near = 1;
  backDirectionalLight.shadow.camera.far = 100;
  scene.add(backDirectionalLight);
}

// Function to handle window resize
function onWindowResize() {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  const aspect = sizes.width / sizes.height;
  const frustumSize = 10;

  camera.left = -frustumSize * aspect / 2;
  camera.right = frustumSize * aspect / 2;
  camera.top = frustumSize / 2;
  camera.bottom = -frustumSize / 2;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  controls.handleResize();
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// Function to load the GLTF model
function loadModel(path) {
  const loader = new GLTFLoader();

  loader.load(
    path,
    (gltf) => {
      model = gltf.scene;
      scene.add(model);

      // Ensure the model has a material with color and reflections
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true; // Enable shadow casting for the model
          node.material = new THREE.MeshStandardMaterial({
            color: 0x74777b,
            metalness: 0.5, // Increase metalness for more reflections
            roughness: 0.3, // Decrease roughness for smoother reflections
            envMap: scene.environment, // Use the environment map for reflections
          });
        }
      });

      // Calculate the bounding box and dimensions of the model
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // Update the OrthographicCamera's projection properties
      const maxDimension = Math.max(size.x, size.y, size.z);
      const frustumSize = maxDimension * 1.2; // Add a bit of padding around the model
      const aspect = sizes.width / sizes.height;

      camera.left = -frustumSize * aspect / 2;
      camera.right = frustumSize * aspect / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      camera.near = 0.1;
      camera.far = maxDimension * 10; // Adjust the far plane as needed
      camera.updateProjectionMatrix();

      // Position the camera to frame the entire model
      const xOffset = maxDimension * 0.5; // Adjust to achieve the desired angle
      const yOffset = maxDimension * 0.5; // Adjust to achieve the desired angle
      const zOffset = maxDimension * 1.5; // Distance from the model

      camera.position.set(center.x - xOffset, center.y + yOffset, zOffset);
      camera.lookAt(center);

      // Update controls target
      controls.target.set(center.x, center.y, center.z);
      controls.update();

      animate(); // Start animation after model is loaded
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
      console.error('An error happened', error);
    }
  );
}

// Initialize and load the imported model
init();
