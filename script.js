let audioContext;
let leftOscillator;
let rightOscillator;
let gainNodeLeft;
let gainNodeRight;
let loopedAudioSource;
let isPlaying = false;

// Play binaural beats
function playBinauralBeats() {
    if (isPlaying) {
        return; // Avoid multiple instances
    }

    // Create an audio context if it doesn't exist
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Get frequencies from input fields
    const leftFrequency = parseFloat(document.getElementById('left-frequency').value);
    const rightFrequency = parseFloat(document.getElementById('right-frequency').value);

    // Calculate frequency difference
    const frequencyDifference = Math.abs(leftFrequency - rightFrequency);

    // Create oscillators for left and right frequencies
    leftOscillator = audioContext.createOscillator();
    rightOscillator = audioContext.createOscillator();

    // Create panner nodes for left and right channels
    const leftPanner = audioContext.createStereoPanner();
    const rightPanner = audioContext.createStereoPanner();

    // Set panning for left and right channels
    leftPanner.pan.setValueAtTime(-1, audioContext.currentTime); // Left ear
    rightPanner.pan.setValueAtTime(1, audioContext.currentTime); // Right ear

    // Connect oscillators to panner nodes
    leftOscillator.connect(leftPanner);
    rightOscillator.connect(rightPanner);

    // Create gain nodes for volume control
    gainNodeLeft = audioContext.createGain();
    gainNodeRight = audioContext.createGain();

    // Set frequencies
    leftOscillator.frequency.setValueAtTime(leftFrequency, audioContext.currentTime);
    rightOscillator.frequency.setValueAtTime(rightFrequency, audioContext.currentTime);

    // Connect panner nodes to gain nodes
    leftPanner.connect(gainNodeLeft);
    rightPanner.connect(gainNodeRight);
    gainNodeLeft.connect(audioContext.destination);
    gainNodeRight.connect(audioContext.destination);

    // Set volume
    gainNodeLeft.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNodeRight.gain.setValueAtTime(0.5, audioContext.currentTime);

    // Start the oscillators
    leftOscillator.start();
    rightOscillator.start();

    // Update UI and state
    isPlaying = true;
    document.getElementById('play-button').style.display = 'none';
    document.getElementById('stop-button').style.display = 'inline-block';
    document.getElementById('info').innerText = `Playing: Left - ${leftFrequency} Hz, Right - ${rightFrequency} Hz`;
    document.getElementById('frequency-difference').innerText = `${frequencyDifference} Hz`;
}

// Stop binaural beats
function stopBinauralBeats() {
    if (!isPlaying) {
        return;
    }

    // Stop oscillators
    if (leftOscillator) leftOscillator.stop();
    if (rightOscillator) rightOscillator.stop();

    // Stop audio file if playing
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

// Handle audio file upload and play it in a loop
document.getElementById('audio-file').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const arrayBuffer = e.target.result;

        // Check if audioContext exists before decoding
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        audioContext.decodeAudioData(arrayBuffer, function(buffer) {
            if (loopedAudioSource) {
                loopedAudioSource.stop(); // Stop any previous audio
            }

            loopedAudioSource = audioContext.createBufferSource();
            loopedAudioSource.buffer = buffer;
            loopedAudioSource.loop = true;

            // Create a gain node for the looped audio
            const loopGainNode = audioContext.createGain();
            loopedAudioSource.connect(loopGainNode);
            loopGainNode.connect(audioContext.destination);
            loopGainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

            // Create a stereo panner for the looped audio
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
