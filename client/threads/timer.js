/** @format */

self.onmessage = e => {
    setTimeout(() => {
        postMessage({ args: e.data.args })
    }, e.data.delay)
}
