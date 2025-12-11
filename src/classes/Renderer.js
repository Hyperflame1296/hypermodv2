class Renderer {
    init(piano) {
        this.piano = piano
        this.resize()
        return this
    }
    resize(width, height) {
        if (typeof width == 'undefined') width = $(this.piano.rootElement).width()
        if (typeof height == 'undefined') height = Math.floor(width * 0.2)
        $(this.piano.rootElement).css({
            height: height + 'px',
            marginTop: Math.floor($(window).height() / 2 - height / 2) + 'px'
        })
        this.width = width * window.devicePixelRatio
        this.height = height * window.devicePixelRatio
    }
    visualize(key, color) {}
}
export {
    Renderer
}