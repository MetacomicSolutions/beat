let audioContext;
let leftOscillator;
let rightOscillator;
let gainNodeLeft;
let gainNodeRight;
let loopedAudioSource;
let loopGainNode;
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


// Share button functionality
document.addEventListener('DOMContentLoaded', function () {
    const shareButton = document.querySelector('.share-button');

    // Check if the share button exists
    if (shareButton) {
        shareButton.addEventListener('click', function() {
            // Check if the Share API is supported
            if (navigator.share) {
                navigator.share({
                    title: 'Binaural Beat Generator',
                    text: 'Check out this cool Binaural Beat Generator!',
                    url: window.location.href
                }).then(() => {
                    console.log('Shared successfully');
                }).catch((error) => {
                    console.error('Error sharing:', error);
                });
            } else {
                // If Share API is not supported, show a copyable link and email option
                const shareLink = window.location.href;

                // Create a simple container to display the link
                const copyModal = document.createElement('div');
                copyModal.style.position = 'fixed';
                copyModal.style.top = '0';
                copyModal.style.left = '0';
                copyModal.style.width = '100%';
                copyModal.style.height = '100%';
                copyModal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                copyModal.style.display = 'flex';
                copyModal.style.alignItems = 'center';
                copyModal.style.justifyContent = 'center';
                copyModal.style.zIndex = '9999';

                // Create a modal content box
                const modalContent = document.createElement('div');
                modalContent.style.backgroundColor = 'white';
                modalContent.style.padding = '20px';
                modalContent.style.textAlign = 'center';
                modalContent.style.borderRadius = '8px';
                modalContent.style.maxWidth = '90%';
                modalContent.style.boxSizing = 'border-box';

                // Create the text area for the share link
                const linkTextArea = document.createElement('textarea');
                linkTextArea.value = shareLink; // Set the share link
                linkTextArea.style.width = '100%';
                linkTextArea.style.height = '50px';
                linkTextArea.style.fontSize = '14px';
                linkTextArea.style.marginBottom = '10px';
                linkTextArea.setAttribute('readonly', true);

                // Create a button to copy the link
                const copyButton = document.createElement('button');
                copyButton.textContent = 'Copy Link';
                copyButton.style.padding = '10px 20px';
                copyButton.style.backgroundColor = '#00d9b2';
                copyButton.style.color = 'white';
                copyButton.style.border = 'none';
                copyButton.style.cursor = 'pointer';
                copyButton.style.borderRadius = '5px';

                // Add click event to copy the link to clipboard
                copyButton.addEventListener('click', function() {
                    linkTextArea.select();
                    document.execCommand('copy'); // Copy the text
                    alert('Link copied to clipboard!'); // Alert user
                });

                // Create a button to send via email
                const emailButton = document.createElement('button');
                emailButton.textContent = 'Send via Email';
                emailButton.style.padding = '10px 20px';
                emailButton.style.backgroundColor = '#4CAF50';
                emailButton.style.color = 'white';
                emailButton.style.border = 'none';
                emailButton.style.cursor = 'pointer';
                emailButton.style.borderRadius = '5px';
                emailButton.style.marginTop = '10px';

                // Add click event to open email client
                emailButton.addEventListener('click', function() {
                    const emailSubject = 'Check out this Binaural Beat Generator';
                    const emailBody = `I found this cool Binaural Beat Generator! You can check it out here: \n\n${shareLink}`;
                    const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
                    window.location.href = mailtoLink; // Open email client with pre-filled info
                });

                // Create a Cancel button to close the modal
                const cancelButton = document.createElement('button');
                cancelButton.textContent = 'Cancel';
                cancelButton.style.padding = '10px 20px';
                cancelButton.style.backgroundColor = '#f44336';
                cancelButton.style.color = 'white';
                cancelButton.style.border = 'none';
                cancelButton.style.cursor = 'pointer';
                cancelButton.style.borderRadius = '5px';
                cancelButton.style.marginTop = '10px';

                // Add click event to close the modal
                cancelButton.addEventListener('click', function() {
                    copyModal.remove(); // Remove modal from DOM
                });

                // Append elements to the modal
                modalContent.appendChild(linkTextArea);
                modalContent.appendChild(copyButton);
                modalContent.appendChild(emailButton);
                modalContent.appendChild(cancelButton);
                copyModal.appendChild(modalContent);

                // Append modal to the body
                document.body.appendChild(copyModal);
            }
        });
    } else {
        console.error('Share button not found!');
    }
});



// Mixer


// Default values for reset
const defaultLeftFrequency = 220;  // Default frequency for the left ear (Hz)
const defaultRightFrequency = 210; // Default frequency for the right ear (Hz)
const defaultVolume = 0.5;         // Default volume for binaural beats and looped audio

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

// Create and configure panner and gain nodes for binaural beats
function configureAudioNodes() {
    const leftPanner = audioContext.createStereoPanner();
    const rightPanner = audioContext.createStereoPanner();
    gainNodeLeft = audioContext.createGain();
    gainNodeRight = audioContext.createGain();

    leftPanner.pan.setValueAtTime(-1, audioContext.currentTime); // Left ear
    rightPanner.pan.setValueAtTime(1, audioContext.currentTime); // Right ear

    leftOscillator.connect(leftPanner);
    rightOscillator.connect(rightPanner);
    leftPanner.connect(gainNodeLeft);
    rightPanner.connect(gainNodeRight);

    gainNodeLeft.connect(audioContext.destination);
    gainNodeRight.connect(audioContext.destination);

    // Set initial volume (default 0.5)
    gainNodeLeft.gain.setValueAtTime(defaultVolume, audioContext.currentTime);
    gainNodeRight.gain.setValueAtTime(defaultVolume, audioContext.currentTime);

    // Set up event listeners for volume sliders
    document.getElementById('left-volume').value = defaultVolume;
    document.getElementById('right-volume').value = defaultVolume;
    document.getElementById('loop-volume').value = 0.3;  // Set default loop volume

    // Linked volume checkbox functionality
    const linkVolumesCheckbox = document.getElementById('link-volumes');
    
    // Sync left and right volume sliders based on the checkbox
    document.getElementById('left-volume').addEventListener('input', function() {
        if (linkVolumesCheckbox.checked) {
            document.getElementById('right-volume').value = this.value;
            gainNodeRight.gain.setValueAtTime(this.value, audioContext.currentTime);
        } else {
            gainNodeLeft.gain.setValueAtTime(this.value, audioContext.currentTime);
        }
    });

    document.getElementById('right-volume').addEventListener('input', function() {
        if (!linkVolumesCheckbox.checked) {
            gainNodeRight.gain.setValueAtTime(this.value, audioContext.currentTime);
        }
    });

    // Link the volumes if checkbox is checked
    linkVolumesCheckbox.addEventListener('change', function() {
        if (this.checked) {
            // Sync right volume with left
            document.getElementById('right-volume').value = document.getElementById('left-volume').value;
            gainNodeRight.gain.setValueAtTime(document.getElementById('left-volume').value, audioContext.currentTime);
        }
    });
}

// Play binaural beats
function playBinauralBeats() {
    if (isPlaying) return; // Avoid multiple instances

    const audioContext = getAudioContext();

    const leftFrequency = parseFloat(document.getElementById('left-frequency').value) || defaultLeftFrequency;
    const rightFrequency = parseFloat(document.getElementById('right-frequency').value) || defaultRightFrequency;

    createBinauralOscillators(leftFrequency, rightFrequency);
    configureAudioNodes();
    isPlaying = true;
    document.getElementById('play-button').style.display = 'none';
    document.getElementById('stop-button').style.display = 'inline-block';
    document.getElementById('info').innerText = `Playing: Left - ${leftFrequency} Hz, Right - ${rightFrequency} Hz`;
}

// Stop binaural beats
function stopBinauralBeats() {
    if (!isPlaying) return;

    leftOscillator.stop();
    rightOscillator.stop();

    isPlaying = false;
    document.getElementById('play-button').style.display = 'inline-block';
    document.getElementById('stop-button').style.display = 'none';
    document.getElementById('info').innerText = 'Binaural beats stopped.';
}

// Handle audio file upload and play it in a loop with volume control
document.getElementById('audio-file').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check if the file size exceeds 7 MB
    const maxSize = 7 * 1024 * 1024; // 7 MB
    if (file.size > maxSize) {
        alert('File is too large. Please upload a file smaller than 7 MB.');
        return;
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
            loopGainNode = audioContext.createGain();
            loopedAudioSource.connect(loopGainNode);
            loopGainNode.connect(audioContext.destination);

            // Set initial volume for looped audio (default 0.3)
            loopGainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

            // Set up event listener for the loop volume slider
            document.getElementById('loop-volume').addEventListener('input', function() {
                loopGainNode.gain.setValueAtTime(this.value, audioContext.currentTime);
            });

            // Start the looped audio
            loopedAudioSource.start();
        }, function(error) {
            console.error("Error decoding audio data:", error);
        });
    };
    reader.readAsArrayBuffer(file);
});

// Stop looped audio if necessary
function stopLoopedAudio() {
    if (loopedAudioSource) {
        loopedAudioSource.stop();
        loopedAudioSource = null;
    }
}

// Reset to default frequencies and volume
function resetToDefault() {
    // Reset frequencies to default
    document.getElementById('left-frequency').value = defaultLeftFrequency;
    document.getElementById('right-frequency').value = defaultRightFrequency;

    // Reset the volume sliders to default
    document.getElementById('left-volume').value = defaultVolume;
    document.getElementById('right-volume').value = defaultVolume;
    document.getElementById('loop-volume').value = 0.3;  // Reset loop volume

    // Reset the gain nodes for default volume
    if (gainNodeLeft) gainNodeLeft.gain.setValueAtTime(defaultVolume, audioContext.currentTime);
    if (gainNodeRight) gainNodeRight.gain.setValueAtTime(defaultVolume, audioContext.currentTime);
    if (loopGainNode) loopGainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

    // Stop any playing audio
    stopBinauralBeats();
    stopLoopedAudio();
    
    // Reset UI information
    document.getElementById('info').innerText = 'Ready to play binaural beats.';
    document.getElementById('frequency-difference').innerText = '0 Hz';
    document.getElementById('play-button').style.display = 'inline-block';
    document.getElementById('stop-button').style.display = 'none';
}

// Add reset button functionality
document.getElementById('reset-button').addEventListener('click', resetToDefault);


// MIXER Div Appear

 // Get the image and the mixer container
    const mixerImage = document.getElementById("mixer-image");
    const mixerContainer = document.querySelector(".mixer-container");

    // Add event listener to the image to toggle visibility of the div
    mixerImage.addEventListener("click", function() {
        // Toggle display of the mixer container
        if (mixerContainer.style.display === "none" || mixerContainer.style.display === "") {
            mixerContainer.style.display = "block";
        } else {
            mixerContainer.style.display = "none";
        }
    });



// Function to properly format and display frequencies in Hertz
function formatFrequencyDisplay() {
    const leftFrequencyInput = document.getElementById('left-frequency');
    const rightFrequencyInput = document.getElementById('right-frequency');
    const infoElement = document.getElementById('info');
    const frequencyDifferenceElement = document.getElementById('frequency-difference');
    
    // Get the current frequency values
    let leftFrequency = parseFloat(leftFrequencyInput.value);
    let rightFrequency = parseFloat(rightFrequencyInput.value);
    
    // Ensure the frequencies are valid numbers
    if (isNaN(leftFrequency) || isNaN(rightFrequency)) {
        return;  // Exit if the frequencies are not valid
    }

    // Format the frequencies to display with one decimal place
    leftFrequency = leftFrequency.toFixed(1);
    rightFrequency = rightFrequency.toFixed(1);

    // Update the display of frequencies in the UI
    if (infoElement) {
        infoElement.innerText = `Playing: Left - ${leftFrequency} Hz, Right - ${rightFrequency} Hz`;
    }

    // Calculate and display the frequency difference
    const frequencyDifference = Math.abs(leftFrequency - rightFrequency);
    if (frequencyDifferenceElement) {
        frequencyDifferenceElement.innerText = `${frequencyDifference} Hz`;
    }
}

// Add event listeners to update the frequency display whenever the user changes the frequency values
document.getElementById('left-frequency').addEventListener('input', formatFrequencyDisplay);
document.getElementById('right-frequency').addEventListener('input', formatFrequencyDisplay);

// Initialize the frequency display on page load
document.addEventListener('DOMContentLoaded', formatFrequencyDisplay);




