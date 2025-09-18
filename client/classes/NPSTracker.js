class NPSTracker {
    constructor(windowMs = 1000, capacity = 1024) {
        this.windowMs = windowMs;
        this.startTime = performance.now();

        // Circular buffer
        this.times = new Float64Array(capacity);
        this.capacity = capacity;
        this.head = 0;  // index of newest
        this.tail = 0;  // index of oldest
        this.size = 0;  // how many valid entries
    }

    noteOn() {
        let now = performance.now() - this.startTime;

        // Insert at head
        this.times[this.head] = now;
        this.head = (this.head + 1) % this.capacity;

        if (this.size < this.capacity) {
            this.size++;
        } else {
            // Overwrite oldest if full
            this.tail = (this.tail + 1) % this.capacity;
        }

        // Trim old notes from the tail
        let cutoff = now - this.windowMs;
        while (this.size > 0 && this.times[this.tail] < cutoff) {
            this.tail = (this.tail + 1) % this.capacity;
            this.size--;
        }

        return this.getNPS();
    }

    getNPS() {
        // Already trimmed, just return count
        return this.size / (this.windowMs / 1000);
    }
}

if (typeof module !== 'undefined') {
    module.exports = NPSTracker;
} else {
    this.NPSTracker = NPSTracker;
}
