(function(hyperMod) {
    return ({
        '.hypermod#main-menu': {},
        '.ugly-button#hypermod-btn': {
            click: e => {
                let div = $('.hypermod#main-menu')
                if ($('.chatting').length == 0)
                    div[0].style.pointerEvents == 'all' ?
                        div.css({
                            'pointer-events': 'none',
                            opacity: '0'
                        })
                    :
                        div.css({
                            'pointer-events': 'all',
                            opacity: '1'
                        })
            }
        },
        '.hypermod#tabs .hypermod': {
            click: e => {
                for (let g of $('.hypermod#tabs .hypermod')) {
                    $(g).removeClass('active')
                    $(`.hypermod#tab-content .hypermod.hm-section#${g.id}-content`).removeClass('active')
                }
                $(e.target).addClass('active')
                $(`.hypermod#tab-content .hypermod.hm-section#${e.target.id}-content`).addClass('active')
            }
        },
        '.hypermod.hm-button#apply-button': {
            click: e => {
                let g = e.target
                $(g).addClass('inactive')
                hyperMod.updateSettings()
                if (typeof MPP !== 'undefined') {
                    if (hyperMod.lsSettings.forceInfNoteQuota) {
                        MPP.noteQuota.setParams(NoteQuota.PARAMS_INFINITE)
                    }
                    MPP.client.uri = hyperMod.lsSettings.connectUrl
                }
            }
        },
        '.hypermod.hm-button#exit-button': {
            click: e => {
                let div = $('.hypermod#main-menu')
                if ($('.chatting').length == 0)
                    div[0].style.pointerEvents == 'all' ?
                        div.css({
                            'pointer-events': 'none',
                            opacity: '0'
                        })
                    :
                        div.css({
                            'pointer-events': 'all',
                            opacity: '1'
                        })
            }
        },
        '.hypermod.hm-button#reconnect-button': {
            click: e => {
                if (typeof MPP === 'undefined')
                    return

                if (MPP.client.isConnected()) {
                    MPP.client.ws.close()
                    MPP.client.connect()
                } else {
                    if (!MPP.client.canConnect)
                        MPP.client.start()
                    else
                        MPP.client.connect()
                }
            }
        },
        '.hypermod.hm-button#reset-url-button': {
            click: e => {
                let applyButton = $('.hypermod.hm-button#apply-button')
                let g = $('input.hypermod.hm-input#ws-url-input')
                g[0].value = 'wss://mppclone.com'
                hyperMod.settings[g[0].dataset.setting] = g.val()
                applyButton.removeClass('inactive')
            }
        },
        '.hypermod.hm-button#play-midi-button': {
            click: async e => {
                hyperMod.playMIDI()
                let play = $(e.target)
                let pause = $('.hypermod.hm-button#pause-midi-button')
                let stop = $('.hypermod.hm-button#stop-midi-button')
            }
        },
        '.hypermod.hm-button#pause-midi-button': {
            click: async e => {
                hyperMod.pauseMIDI()
                let play = $('.hypermod.hm-button#play-midi-button')
                let pause = $(e.target)
                let stop = $('.hypermod.hm-button#stop-midi-button')
            }
        },
        '.hypermod.hm-button#stop-midi-button': {
            click: async e => {
                hyperMod.stopMIDI()
                let play = $('.hypermod.hm-button#play-midi-button')
                let pause = $('.hypermod.hm-button#pause-midi-button')
                let stop = $(e.target)
            }
        },
        '.hypermod.hm-button#add-midi-button': {
            click: async e => {
                if (hyperMod.player.isPlaying)
                    return

                await hyperMod.openMIDIDialog()
            }
        },
        'input.hypermod': {
            change: e => {
                let g = e.target
                if (!g.dataset.setting)
                    return
                if (typeof hyperMod.settings[g.dataset.setting] === 'undefined')
                    return
                let applyButton = $('.hypermod.hm-button#apply-button')
                switch (g.type) {
                    case 'checkbox':
                        hyperMod.settings[g.dataset.setting] = g.checked
                        applyButton.removeClass('inactive')
                        break
                    case 'range':
                        hyperMod.settings[g.dataset.setting] = +g.value
                        applyButton.removeClass('inactive')
                        break
                }
            },
            input: e => {
                let g = e.target
                if (!g.dataset.setting)
                    return
                if (typeof hyperMod.settings[g.dataset.setting] === 'undefined')
                    return
                let applyButton = $('.hypermod.hm-button#apply-button')
                switch (g.type) {
                    case 'range':
                        let s = $(`span.hypermod[data-setting=${g.dataset.setting}]`)
                        s.html(g.value)
                        break
                    case 'text':
                        hyperMod.settings[g.dataset.setting] = g.value
                        applyButton.removeClass('inactive')
                        break
                }
            }
        }
    })
})