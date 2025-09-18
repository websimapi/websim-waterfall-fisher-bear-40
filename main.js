import * as THREE from 'three';
import { scene, camera, renderer, resizeRenderer, createLights, getOrbitControls, mountRenderer } from './scene.js';
import { updateBear } from './entities/bear.js';
import { createScenery } from './entities/scenery.js';
import { createWaterfall, updateWaterfall } from './entities/waterfall.js';
import { updateFish } from './entities/fish.js';
import { initAudio, wireAudioUnlock } from './systems/audio.js';
import { bindUI } from './systems/ui.js';
import { initDevTools } from './systems/devTools.js';
import { initControls, getMoveDirection } from './systems/controls.js';
import { 
    gameState, 
    gameEntities,
    setupStartScreen, 
    startGame, 
    updateGameState
} from './systems/gameState.js';
import { 
    updateFishSpawner, 
    resolveFishCollisions,
    getActiveFishes
} from './systems/fishSpawner.js';

// --- SCENE SETUP ---
const scenery = createScenery();
scene.add(scenery);
const waterfall = createWaterfall();
scene.add(waterfall);
createLights(scene);

// --- INITIALIZATION ---
bindUI();
initDevTools();
initControls();
document.getElementById('start-button').addEventListener('click', startGame);
wireAudioUnlock(initAudio);
setupStartScreen();

// --- GAME LOOP ---
function animate() {
    requestAnimationFrame(animate); 

    const controls = getOrbitControls();
    if (controls?.enabled) {
        controls.update();
    }

    updateWaterfall(waterfall);
    
    updateGameState();

    if (gameState.current === 'PLAYING') {
        const moveDirection = getMoveDirection();
        updateBear(gameEntities.bear, moveDirection);

        updateFishSpawner(gameEntities.bear);
        
        getActiveFishes().forEach(updateFish);
        
        resolveFishCollisions(gameEntities.bear);
    } 

    renderer.render(scene, camera);
}

// --- MOUNT & START ---
mountRenderer(document.getElementById('game-container'));
window.addEventListener('resize', resizeRenderer);
animate();