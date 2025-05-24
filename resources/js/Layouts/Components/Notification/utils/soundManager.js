class SoundManager {
    constructor() {
        this.sounds = {
            newNotification: null,
            markRead: null,
        };
        this.isEnabled = localStorage.getItem('bion-notifications-sound') !== 'false';
        this.volume = parseFloat(localStorage.getItem('bion-notifications-volume')) || 0.6;
        this.initializeSounds();
    }

    initializeSounds() {
        // Try to load actual sound files first
        this.sounds.newNotification = this.createAudio([
            '/sounds/notification-drop.mp3',
            '/sounds/notification-drop.wav',
            '/sounds/notification-drop.ogg'
        ]);

        this.sounds.markRead = this.createAudio([
            '/sounds/notification-read.mp3',
            '/sounds/notification-read.wav',
            '/sounds/notification-read.ogg'
        ]);
    }

    createAudio(sources) {
        const audio = new Audio();
        audio.volume = this.volume;
        audio.preload = 'auto';

        // Try to find a supported format
        for (const src of sources) {
            const canPlay = audio.canPlayType(this.getAudioType(src));
            if (canPlay === 'probably' || canPlay === 'maybe') {
                audio.src = src;
                break;
            }
        }

        // Fallback: create synthetic sound if no files available
        if (!audio.src) {
            return this.createSyntheticDropSound();
        }

        return audio;
    }

    getAudioType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const types = {
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'ogg': 'audio/ogg'
        };
        return types[ext] || '';
    }

    // Create a professional "drop" sound using Web Audio API
    createSyntheticDropSound() {
        return {
            play: () => {
                if (!this.isEnabled) return;

                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    const filter = audioContext.createBiquadFilter();

                    // Create filter for more professional sound
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(800, audioContext.currentTime);

                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    // Create a pleasant "notification" sound
                    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.1);
                    oscillator.frequency.exponentialRampToValueAtTime(450, audioContext.currentTime + 0.2);
                    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.4);

                    gainNode.gain.setValueAtTime(this.volume * 0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.4);
                } catch (error) {
                    console.warn('Could not play notification sound:', error);
                }
            }
        };
    }

    playNewNotification() {
        if (this.isEnabled && this.sounds.newNotification) {
            this.sounds.newNotification.play().catch(error => {
                console.warn('Could not play new notification sound:', error);
            });
        }
    }

    playMarkRead() {
        if (this.isEnabled && this.sounds.markRead) {
            this.sounds.markRead.play().catch(error => {
                console.warn('Could not play mark read sound:', error);
            });
        }
    }

    toggleSound() {
        this.isEnabled = !this.isEnabled;
        localStorage.setItem('bion-notifications-sound', this.isEnabled.toString());
        return this.isEnabled;
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('bion-notifications-volume', this.volume.toString());

        // Update existing audio objects
        if (this.sounds.newNotification && this.sounds.newNotification.volume !== undefined) {
            this.sounds.newNotification.volume = this.volume;
        }
        if (this.sounds.markRead && this.sounds.markRead.volume !== undefined) {
            this.sounds.markRead.volume = this.volume;
        }
    }

    isSoundEnabled() {
        return this.isEnabled;
    }

    getVolume() {
        return this.volume;
    }
}

export const soundManager = new SoundManager();
