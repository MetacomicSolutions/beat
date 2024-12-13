let audioContext;
let leftOscillator;
let rightOscillator;
let gainNodeLeft;
let gainNodeRight;
let loopedAudioSource;
let isPlaying = false;

// Initialize AudioContext if needed
function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

// Create and start oscillators for binaural beats
function createBinauralOscillators(leftFrequency, rightFrequency) {
    leftOscillator = audioContext.createOscillator();
    rightOscillator = audioContext.createOscillator();

    leftOscillator.frequency.setValueAtTime(leftFrequency, audioContext.currentTime);
    rightOscillator.frequency.setValueAtTime(rightFrequency, audioContext.currentTime);

    leftOscillator.start();
    rightOscillator.start();
}

// Create and configure panner and gain nodes
function configureAudioNodes() {
    const leftPanner = audioContext.createStereoPanner();
    const rightPanner = audioContext.createStereoPanner();
    const gainNodeLeft = audioContext.createGain();
    const gainNodeRight = audioContext.createGain();

    leftPanner.pan.setValueAtTime(-1, audioContext.currentTime); // Left ear
    rightPanner.pan.setValueAtTime(1, audioContext.currentTime); // Right ear

    leftOscillator.connect(leftPanner);
    rightOscillator.connect(rightPanner);
    leftPanner.connect(gainNodeLeft);
    rightPanner.connect(gainNodeRight);

    gainNodeLeft.connect(audioContext.destination);
    gainNodeRight.connect(audioContext.destination);

    gainNodeLeft.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNodeRight.gain.setValueAtTime(0.5, audioContext.currentTime);
}

// Update UI after starting binaural beats
function updateUIAfterPlay(leftFrequency, rightFrequency, frequencyDifference) {
    isPlaying = true;
    document.getElementById('play-button').style.display = 'none';
    document.getElementById('stop-button').style.display = 'inline-block';
    document.getElementById('info').innerText = `Playing: Left - ${leftFrequency} Hz, Right - ${rightFrequency} Hz`;
    document.getElementById('frequency-difference').innerText = `${frequencyDifference} Hz`;
}

// Play binaural beats
function playBinauralBeats() {
    if (isPlaying) return; // Avoid multiple instances

    const audioContext = getAudioContext();

    const leftFrequency = parseFloat(document.getElementById('left-frequency').value);
    const rightFrequency = parseFloat(document.getElementById('right-frequency').value);
    const frequencyDifference = Math.abs(leftFrequency - rightFrequency);

    createBinauralOscillators(leftFrequency, rightFrequency);
    configureAudioNodes();
    updateUIAfterPlay(leftFrequency, rightFrequency, frequencyDifference);
}

// Stop binaural beats
function stopBinauralBeats() {
    if (!isPlaying) return;

    leftOscillator.stop();
    rightOscillator.stop();

    if (loopedAudioSource) {
        loopedAudioSource.stop();
    }

    // Update UI and state
    isPlaying = false;
    document.getElementById('play-button').style.display = 'inline-block';
    document.getElementById('stop-button').style.display = 'none';
    document.getElementById('info').innerText = 'Binaural beats stopped.';
    document.getElementById('frequency-difference').innerText = '0 Hz';
}

// Handle audio file upload and play it in a loop with size check
document.getElementById('audio-file').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check if the file size exceeds 7 MB (7 * 1024 * 1024 bytes)
    const maxSize = 7 * 1024 * 1024; // 7 MB
    if (file.size > maxSize) {
        alert('File is too large. Please upload a file smaller than 7 MB.');
        return; // Abort the upload process
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const arrayBuffer = e.target.result;

        const audioContext = getAudioContext();

        audioContext.decodeAudioData(arrayBuffer, function(buffer) {
            if (loopedAudioSource) loopedAudioSource.stop(); // Stop previous audio if any

            loopedAudioSource = audioContext.createBufferSource();
            loopedAudioSource.buffer = buffer;
            loopedAudioSource.loop = true;

            // Create and configure loop gain node
            const loopGainNode = audioContext.createGain();
            loopedAudioSource.connect(loopGainNode);
            loopGainNode.connect(audioContext.destination);
            loopGainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

            // Create and configure stereo panner for looped audio
            const loopPanner = audioContext.createStereoPanner();
            loopPanner.pan.setValueAtTime(0, audioContext.currentTime); // Centered
            loopGainNode.connect(loopPanner);
            loopPanner.connect(audioContext.destination);

            loopedAudioSource.start();
        }, function(error) {
            console.error("Error decoding audio data:", error);
        });
    };
    reader.readAsArrayBuffer(file);
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    });
}
