let g=(() => ({
    'div.hypermod#main-menu': {},
    'div.ugly-button#hypermod-btn': {
        click: e => {
            let div = $('.hypermod#main-menu')
            if ($('.chatting').length == 0)
                div[0].style.display == 'block' ?
                    div.css({
                        display: 'none'
                    })
                :
                    div.css({
                        display: 'block'
                    })
        }
    },
    'div.hypermod#tabs div.hypermod': {
        click: e => {
            for (let g of $('div.hypermod#tabs div.hypermod')) {
                $(g).removeClass('active')
                $(`div.hypermod#tab-content div.hypermod.hm-section#${g.id}-content`).removeClass('active')
            }
            $(e.target).addClass('active')
            $(`div.hypermod#tab-content div.hypermod.hm-section#${e.target.id}-content`).addClass('active')
        }
    },
    'div.hypermod#buttons div.hypermod.hm-button#apply-button': {
        click: e => {
            let g = e.target
            $(g).addClass('inactive')
            this.updateSettings()
            if (typeof MPP !== 'undefined') {
                if (this.lsSettings.forceInfNoteQuota) {
                    MPP.noteQuota.setParams(NoteQuota.PARAMS_INFINITE)
                }
            }
        }
    },
    'div.hypermod#buttons div.hypermod.hm-button#exit-button': {
        click: e => {
            let div = $('.hypermod#main-menu')
            if ($('.chatting').length == 0)
                div[0].style.display == 'block' ?
                    div.css({
                        display: 'none'
                    })
                :
                    div.css({
                        display: 'block'
                    })
        }
    },
    'input.hypermod': {
        ready: e => {
            console.log(e)
        },
        change: e => {
            let g = e.target
            if (!g.dataset.setting)
                return

            let applyButton = $('div.hypermod#buttons div.hypermod.hm-button#apply-button')
            switch (g.type) {
                case 'checkbox':
                    this.settings[g.dataset.setting] = g.checked
                    applyButton.removeClass('inactive')
                    break
                case 'range':
                    this.settings[g.dataset.setting] = +g.value
                    applyButton.removeClass('inactive')
                    break
            }
        },
        input: e => {
            let g = e.target
            if (!g.dataset.setting)
                return

            switch (g.type) {
                case 'range':
                    let s = $(`span.hypermod[data-setting=${g.dataset.setting}]`)
                    s.html(g.value)
                    break
            }
        }
    }
}))
g()