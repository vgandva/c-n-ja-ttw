'use strict';

// Import necessary dependencies (e.g., Marzipano, WebXR Polyfill)
var mat4 = Marzipano.dependencies.glMatrix.mat4;
var quat = Marzipano.dependencies.glMatrix.quat;
var degToRad = Marzipano.util.degToRad;

var viewerElement = document.querySelector("#pano");
var enterVrElement = document.querySelector("#enter-vr");
var noVrElement = document.querySelector("#no-vr");
var reticleElement = document.querySelector("#reticle");

// Install the WebVR Polyfill for fallback to Google Cardboard-style VR
var polyfill = new WebVRPolyfill();

// Create the WebGL Stage for rendering
var stage = new Marzipano.WebGlStage();
Marzipano.registerDefaultRenderers(stage);

// Insert the stage into the DOM
viewerElement.appendChild(stage.domElement());

// Update the stage size whenever the window is resized
function updateSize() {
  stage.setSize({
    width: viewerElement.clientWidth,
    height: viewerElement.clientHeight
  });
}
updateSize();
window.addEventListener('resize', updateSize);

// Create geometry for the panorama
var geometry = new Marzipano.CubeGeometry([ 
  { tileSize: 256, size: 256, fallbackOnly: true },
  { tileSize: 512, size: 512 },
  { tileSize: 512, size: 1024 },
  { tileSize: 512, size: 2048 },
  { tileSize: 512, size: 4096 }
]);

// Create views for stereoscopic rendering (left and right)
var limiter = Marzipano.RectilinearView.limit.traditional(4096, 110 * Math.PI / 180);
var viewLeft = new WebVrView();
var viewRight = new WebVrView();

// Create layers for the left and right views
var layerLeft = createLayer(stage, viewLeft, geometry, 'left', { relativeWidth: 0.5, relativeX: 0 });
var layerRight = createLayer(stage, viewRight, geometry, 'right', { relativeWidth: 0.5, relativeX: 0.5 });

// Add layers to the stage
stage.addLayer(layerLeft);
stage.addLayer(layerRight);

// VR-related variables
var xrSession = null;
var vrDisplay = null;
var vrDisplayAvailable = false;
var reticleVisible = false;

// Check for available VR devices
navigator.getVRDisplays().then(function(vrDisplays) {
  if (vrDisplays.length > 0) {
    vrDisplay = vrDisplays[0];
    vrDisplayAvailable = true;
    enterVrElement.style.display = 'block';
  } else {
    enterVrElement.style.display = 'none';
    noVrElement.style.display = 'block';
    showNormalPanorama();  // Show the simple Marzipano view
  }
});

// Show the normal panorama (non-VR mode)
function showNormalPanorama() {
  // Example: Show the normal panorama view
  var layerNormal = createLayer(stage, new Marzipano.RectilinearView(), geometry, 'normal', { relativeWidth: 1, relativeX: 0 });
  stage.addLayer(layerNormal);
}

// Enter WebXR VR mode
enterVrElement.addEventListener('click', function() {
  if (xrSession) {
    xrSession.requestReferenceSpace("local").then(function(refSpace) {
      xrSession.requestAnimationFrame(render);
    });
  } else {
    // Initiate WebXR session if it's not already active
    navigator.xr.requestSession("immersive-vr", {
      optionalFeatures: ["local"]
    }).then(function(session) {
      xrSession = session;
      xrSession.requestAnimationFrame(render);
    });
  }
});

// Create layers from the geometry (left and right eye)
function createLayer(stage, view, geometry, eye, rect) {
  var urlPrefix = "//www.marzipano.net/media/music-room";
  var source = new Marzipano.ImageUrlSource.fromString(
    urlPrefix + "/" + eye + "/{z}/{f}/{y}/{x}.jpg", 
    { cubeMapPreviewUrl: urlPrefix + "/" + eye + "/preview.jpg" });

  var textureStore = new Marzipano.TextureStore(source, stage);
  var layer = new Marzipano.Layer(source, geometry, view, textureStore, { effects: { rect: rect } });
  layer.pinFirstLevel();

  return layer;
}

// Create reticle interaction
function createReticle() {
  reticleElement.style.position = "absolute";
  reticleElement.style.width = "20px";
  reticleElement.style.height = "20px";
  reticleElement.style.background = "red";
  reticleElement.style.borderRadius = "50%";
  reticleElement.style.display = "none"; // Initially hidden
  viewerElement.appendChild(reticleElement);
}

// Trigger hotspot when reticle is over a hotspot (dummy example)
function triggerHotspot() {
  console.log("Hotspot triggered!");
}

// Handle VR rendering frame
function render() {
  var frameData = new VRFrameData();
  xrSession.requestAnimationFrame(render);

  // Get the pose and projections for the left and right eye
  xrSession.getFrameData(frameData);
  var pose = frameData.pose;
  var leftProjection = frameData.leftProjectionMatrix;
  var rightProjection = frameData.rightProjectionMatrix;

  // Update the stereoscopic view based on the pose and projections
  mat4.fromQuat(pose, pose.orientation);
  mat4.invert(pose, pose);

  // Apply projections for left and right eye
  viewLeft.setProjection(leftProjection);
  viewRight.setProjection(rightProjection);

  // Render the scene
  stage.render();

  // Update reticle position for hotspot interaction (dummy example)
  if (reticleVisible) {
    reticleElement.style.display = "block"; // Show reticle
    // Adjust reticle position logic based on gaze
    reticleElement.style.top = "50%"; // Centered position as placeholder
    reticleElement.style.left = "50%";
  } else {
    reticleElement.style.display = "none"; // Hide reticle
  }

  // Trigger hotspot interaction (dummy)
  triggerHotspot();
}

// Call createReticle to initialize the reticle
createReticle();
