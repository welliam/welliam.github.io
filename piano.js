function isBlack(nth) {
    switch(nth % 12) {
    case 0: case 2: case 4: case 5: case 7: case 9: case 11:
        return false;
    default:
        return true;
    }
}

function keyPosition(nth) {
    // warning: only works on the interval (0 <= nth < 12)!
    return 25 * (nth + (nth > 4 ? 1 : 0))
}

function makeKey(nth, startx, starty) {
    startx = startx || 0
    starty = starty || 0

    var label = document.createElement('label'),
        checkbox = document.createElement('input'),
        position = keyPosition(nth),
        keyisblack = isBlack(nth)

    label.appendChild(checkbox)

    checkbox.setAttribute('type', 'checkbox')
    checkbox.setAttribute('id', 'box')
    checkbox.setAttribute('class', 'keycheckbox')

    label.setAttribute('class', keyisblack ? 'blackkey' : 'whitekey')
    label.style.top = starty + 'px'
    label.style.left = startx + position + (keyisblack ? 10 : 0) + 'px'
    label.style.zIndex = keyisblack ? '1' : '0'

    return {
        label: label,
        checkbox: checkbox,
        nth: nth
    }
}

function loadAudio(audiopath) {
    var audio = document.createElement('audio')
    audio.style.display = 'none'
    audio.setAttribute('src', audiopath)
    audio.setAttribute('preload', 'auto')
}

function updateScalenum(to) {
    document.getElementById('scalenum').innerHTML = to
}

function setbit(n, bit, on) {
    return n ^ (((on ? -1 : 0) ^ n) & (1 << n));
}

window.onload = function() {
    var keys = [],
        piano = document.getElementById('piano'),
        scale = 0

    for(var i = 0; i < 12; i++) {
        (function () {
            var key = makeKey(i)
            key.checkbox.onclick = function() {
                scale ^= 1 << key.nth
                updateScalenum(scale)
            }
            keys.push(key)
            piano.appendChild(key.label)
        })()
    }

    document.getElementById('clear').onclick = function() {
        keys.forEach(function (k) {
            if (k.checkbox.checked) {
                k.checkbox.onclick()
                k.checkbox.checked = false
            }
        })
    }

    updateScalenum(scale)
}
