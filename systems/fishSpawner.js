
```javascript
import { createFish } from '../entities/fish.js';
import { playSFX, sounds } from '../systems/audio.js';
import { scene } from '../scene.js';
import { updateUIValues } from '../systems/ui.js';
import { FISH } from '../unlocks.js';
import { gameOver, gameState, playerProgress, bear } from '../main.js';

let activeFishes = [];
let spawnTimer = 0;
const maxConcurrent = 3;
let currentPattern = null;
let patternStep = 0;

function nextPattern() {
    const stairs = (dir='right') => {
        const xs = [-3,-2,-1,0,1,2,3];
        return xs.map((v,i)=>({ x: dir==='right'?xs[i]:xs[xs.length-1-i], delay: 18, move: 'zigzag' }));
    };
    const sine = () => {
        const steps = 10, amp = 3;
        return Array.from({length: steps}, (_,i)=>({ x: Math.sin((i/steps)*Math.PI*2)*amp, delay: 12, move: 'sine' }));
    };
    const lanes = () => {
        const seq = [-2,0,2,-2,0,2];
        return seq.map(x=>({ x, delay: 15, move: 'drift' }));
    };
    const choices = [ () => stairs('right'), () => stairs('left'), sine, lanes ];
    currentPattern = { steps: choices[Math.floor(Math.random()*choices.length)]() };
    patternStep = 0; 
    spawnTimer = 0;
}

function getFishToSpawn() {
    const selectedFishInfo = FISH.find(f => f.id === playerProgress.selectedFish) || FISH[0];
    const availableFish = FISH.filter(f => 
        playerProgress.unlockedFish.includes(f.id) && f.difficulty <= selectedFishInfo.difficulty
    );
    return (availableFish[Math.floor(Math.random() * availableFish.length)]) || FISH[0];
}

export function updateFishSpawner() {
    if (!currentPattern) nextPattern();
    if (spawnTimer-- <= 0 && activeFishes.length < maxConcurrent) {
        const step = currentPattern.steps[patternStep];
        const fishInfo = getFishToSpawn();
        const f = createFish(scene, gameState.score, fishInfo.id, { x: step.x, pattern: step.move });
        activeFishes.push(f);
        spawnTimer = step.delay;
        patternStep++;
        if (patternStep >= currentPattern.steps.length) {
            currentPattern = null;
            spawnTimer = 45; // gap between sequences
        }
    }
}

export function resolveFishCollisions() {
    const catchZ = -0.8, failZ = -0.4;
    for (let i = activeFishes.length - 1; i >= 0; i--) {
        const f = activeFishes[i];
        if (f.position.z >= catchZ) {
            const withinX = Math.abs(f.position.x - bear.position.x) <= (bear.userData.netWidth || 1) / 2;
            if (withinX) {
                playSFX(sounds.catch);
                gameState.score += 10 * gameState.streak;
                gameState.streak++;
                updateUIValues({ score: gameState.score, streak: gameState.streak });
                scene.remove(f); 
                activeFishes.splice(i,1);
            } else if (f.position.z > failZ) {
                gameState.streak = 1;
                updateUIValues({ score: gameState.score, streak: gameState.streak });
                scene.remove(f); 
                activeFishes.splice(i,1);
                gameOver(); 
                break;
            }
        }
    }
}

export function getActiveFishes() {
    return activeFishes;
}

export function resetSpawner() {
    activeFishes.forEach(f => scene.remove(f));
    activeFishes = [];
    spawnTimer = 0; 
    currentPattern = null; 
    patternStep = 0;
}