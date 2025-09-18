
```javascript
import * as THREE from 'three';
import { camera, scene } from '../scene.js';
import { BEAR_X_LIMIT } from '../entities/bear.js';
import { toggleDevTools } from './devTools.js';
import { gameState, gameEntities } from './gameState.js';

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let keysPressed = {};
let isDragging = false;

function onPointerDown(event) {
    if (gameState.current !== 'PLAYING' || event.target.tagName === 'BUTTON') return;
    isDragging = true;
    onPointerMove(event);
}

function onPointerMove(event) {
    if (!isDragging || gameState.current !== 'PLAYING' || !gameEntities.bear) return;

    updatePointer(event);
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    for (const intersect of intersects) {
        let object = intersect.object;
        let isLog = false;
        while (object.parent) {
            if (object.name === 'log') { isLog = true; break; }
            object = object.parent;
        }

        if (isLog) {
            gameEntities.bear.userData.targetX = THREE.MathUtils.clamp(intersect.point.x, -BEAR_X_LIMIT, BEAR_X_LIMIT);
            gameEntities.bear.userData.isMovingWithKeys = false;
            break; 
        }
    }
}

function onPointerUp() {
    isDragging = false;
}

function updatePointer(event) {
    const eventCoord = event.changedTouches ? event.changedTouches[0] : event;
    pointer.x = (eventCoord.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(eventCoord.clientY / window.innerHeight) * 2 + 1;
}

function handleKeyDown(event) {
    if (gameState.current !== 'PLAYING' || !gameEntities.bear) return;
    keysPressed[event.key] = true;
    if (event.key === 'a' || event.key === 'ArrowLeft' || event.key === 'd' || event.key === 'ArrowRight') {
        gameEntities.bear.userData.isMovingWithKeys = true;
    }
}

function handleKeyUp(event) {
    keysPressed[event.key] = false;
    if (event.key === 'a' || event.key === 'ArrowLeft' || event.key === 'd' || event.key === 'ArrowRight') {
        if (!keysPressed['a'] && !keysPressed['ArrowLeft'] && !keysPressed['d'] && !keysPressed['ArrowRight']) {
            if (gameEntities.bear) gameEntities.bear.userData.isMovingWithKeys = false;
        }
    }
}

function handleGlobalKeyUp(event) {
    if (event.key === '`' || event.key === '~') {
        toggleDevTools();
    }
}

export function initControls() {
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keyup', handleGlobalKeyUp);
}

export function getMoveDirection() {
    if (keysPressed['a'] || keysPressed['ArrowLeft']) return -1;
    if (keysPressed['d'] || keysPressed['ArrowRight']) return 1;
    return 0;
}