import * as THREE from 'three';
import { scene } from '../scene.js';
import { createBear } from '../entities/bear.js';
import { createFish } from '../entities/fish.js';
import { playSFX, sounds } from './audio.js';
import { updateUIValues, showGameOver, showHUD, showStart, populateUnlocks } from './ui.js';
import { BEARS, FISH, getPlayerProgress, savePlayerProgress } from '../unlocks.js';
import { resetSpawner } from './fishSpawner.js';

// --- STATE MANAGEMENT ---
export let gameState = { current: 'IDLE', score: 0, streak: 1, idleAnimTimer: 0 };
export let playerProgress = getPlayerProgress();
export let gameEntities = {
    bear: null,
    showcaseBear: null,
    showcaseFish: null,
};

function refreshShowcase() {
    if (gameEntities.showcaseBear) scene.remove(gameEntities.showcaseBear);
    if (gameEntities.showcaseFish) {
        if (gameEntities.showcaseFish.parent) gameEntities.showcaseFish.parent.remove(gameEntities.showcaseFish);
        else scene.remove(gameEntities.showcaseFish);
    }

    gameEntities.showcaseBear = createBear(playerProgress.selectedBear);
    gameEntities.showcaseBear.name = 'showcase-bear';
    gameEntities.showcaseBear.position.set(0, 4.65, 0.8);
    gameEntities.showcaseBear.rotation.set(0, 0, 0); // Face camera
    scene.add(gameEntities.showcaseBear);

    gameEntities.showcaseFish = createFish(scene, 0, playerProgress.selectedFish);
    gameEntities.showcaseFish.name = 'showcase-fish';
    
    const rightArm = gameEntities.showcaseBear.getObjectByName('rightArm');
    if (rightArm) {
        scene.remove(gameEntities.showcaseFish);
        rightArm.add(gameEntities.showcaseFish);
        gameEntities.showcaseFish.position.set(0.1, -0.7, 0.4);
        gameEntities.showcaseFish.rotation.set(-Math.PI / 4, Math.PI / 2, Math.PI);
        gameEntities.showcaseFish.scale.set(0.5, 0.5, 0.5);
    } else {
        gameEntities.showcaseFish.position.set(2.0, 2.3, -1.5);
    }
    
    if (gameEntities.showcaseFish.userData?.velocity) gameEntities.showcaseFish.userData.velocity.set(0, 0, 0);
    if (gameEntities.showcaseFish.userData) gameEntities.showcaseFish.userData.swimAmplitude = 0;
}

export function setupStartScreen() {
    gameState.current = 'IDLE';
    if (gameEntities.bear) gameEntities.bear.visible = false;
    
    const startButton = document.getElementById('start-button');
    if (startButton) startButton.innerText = 'START';
    
    populateUnlocks(playerProgress, (type, id) => {
        if (type === 'bear') playerProgress.selectedBear = id;
        if (type === 'fish') playerProgress.selectedFish = id;
        savePlayerProgress(playerProgress);
        
        const quickBearName = document.querySelector('#choose-bear span');
        const quickBearImg = document.querySelector('#choose-bear img');
        const quickFishName = document.querySelector('#choose-fish span');
        const quickFishImg = document.querySelector('#choose-fish img');
        
        const selectedBearInfo = BEARS.find(b => b.id === playerProgress.selectedBear);
        const selectedFishInfo = FISH.find(f => f.id === playerProgress.selectedFish);

        if(quickBearName) quickBearName.textContent = selectedBearInfo.name;
        if(quickBearImg) quickBearImg.src = selectedBearInfo.asset;
        if(quickFishName) quickFishName.textContent = selectedFishInfo.name;
        if(quickFishImg) quickFishImg.src = selectedFishInfo.asset;

        refreshShowcase();
    });
    refreshShowcase();
    showStart();
}

export function startGame() {
    gameState = { current: 'PLAYING', score: 0, streak: 1 };
    
    if (gameEntities.showcaseBear) scene.remove(gameEntities.showcaseBear);
    if (gameEntities.showcaseFish) {
         if(gameEntities.showcaseFish.parent) gameEntities.showcaseFish.parent.remove(gameEntities.showcaseFish);
         else scene.remove(gameEntities.showcaseFish); 
    }
    gameEntities.showcaseBear = null;
    gameEntities.showcaseFish = null;
    
    if (gameEntities.bear) scene.remove(gameEntities.bear);
    gameEntities.bear = createBear(playerProgress.selectedBear);
    scene.add(gameEntities.bear);

    gameEntities.bear.position.x = 0;
    updateUIValues({ score: gameState.score, streak: gameState.streak });
    showHUD();
    
    resetSpawner();
}

export function gameOver(fishes) {
    gameState.current = 'GAME_OVER';
    document.getElementById('final-score').innerText = gameState.score;
    
    if (gameState.score > playerProgress.highScore) {
        playerProgress.highScore = gameState.score;
    }
    BEARS.forEach(bear => {
        if (!playerProgress.unlockedBears.includes(bear.id) && bear.unlockCondition.type === 'score' && playerProgress.highScore >= bear.unlockCondition.value) {
            playerProgress.unlockedBears.push(bear.id);
        }
    });
    FISH.forEach(fish => {
        if (!playerProgress.unlockedFish.includes(fish.id) && fish.unlockCondition.type === 'score' && playerProgress.highScore >= fish.unlockCondition.value) {
            playerProgress.unlockedFish.push(fish.id);
        }
    });
    savePlayerProgress(playerProgress);

    showGameOver();
    playSFX(sounds.splash);
    fishes.forEach(f => scene.remove(f));
    fishes.length = 0; // Clear the array

    setTimeout(() => {
        const goScreen = document.getElementById('game-over-screen');
        if (goScreen) {
            goScreen.classList.add('fade-out');
            const startButton = document.getElementById('start-button');
            const onFadeOut = () => {
                goScreen.removeEventListener('animationend', onFadeOut);
                setupStartScreen();
                if (startButton) startButton.innerText = 'RETRY';
            };
            goScreen.addEventListener('animationend', onFadeOut);
        }
    }, 2000);
}

const gravity = new THREE.Vector3(0, -0.05, 0);

export function updateGameState() {
    if (gameState.current === 'GAME_OVER') {
        if (gameEntities.bear && gameEntities.bear.position.y > -10) {
            gameEntities.bear.position.add(gravity);
            gameEntities.bear.rotation.z += 0.05;
        }
    } else if (gameState.current === 'IDLE') {
        gameState.idleAnimTimer += 0.05;
        if (gameEntities.showcaseBear) {
            const rightArm = gameEntities.showcaseBear.getObjectByName('rightArm');
            if (rightArm) {
                const armBob = Math.sin(gameState.idleAnimTimer) * 0.1;
                rightArm.rotation.x = armBob;
            }
        }
    }
}

