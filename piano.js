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

var generateId = (function () {
    var x = 0
    return function() {
        return '___' + (x++).toString() + '___'
    }
})()

function makeKey(nth, startx, starty) {
    startx = startx || 0
    starty = starty || 0

    var id = generateId(),
        span = document.createElement('span'),
        label = document.createElement('label'),
        checkbox = document.createElement('input'),
        position = keyPosition(nth),
        keyisblack = isBlack(nth)

    span.appendChild(checkbox)
    span.appendChild(label)

    checkbox.setAttribute('id', id)
    checkbox.setAttribute('type', 'checkbox')
    checkbox.setAttribute('class', 'keycheckbox')

    label.setAttribute('for', id)
    label.setAttribute(
        'class', 'key ' + (keyisblack ? 'blackkey' : 'whitekey')
    )
    label.style.top = starty + 'px'
    label.style.left = startx + position + (keyisblack ? 10 : 0) + 'px'
    label.style.zIndex = keyisblack ? '1' : '0'

    return {
        span: span,
        checkbox: checkbox,
        nth: nth
    }
}

function makeKeys(parent, listener) {
    var keys = []
    for(var i = 0; i < 12; i++) {
        (function () {
            var key = makeKey(i)
            key.checkbox.onclick = function() {
                listener(key.nth)
            }
            keys.push(key)
            parent.appendChild(key.span)
        })()
    }
    return keys
}

function loadAudio(audiopath) {
    var audio = document.createElement('audio')
    audio.style.display = 'none'
    audio.setAttribute('src', audiopath)
    audio.setAttribute('preload', 'auto')
}

// function similarScales(s1, scales) {
//     var subsets = [],
//         supersets = [],
//         same = []
//     scales.forEach(function (s2) {
//         if (s1 == s2) {
//             same.push(s2)
//         } else if (s1 & s2 == s1) {
//             subsets.push(s2)
//         } else if (s1 & s2 == s2) {
//             supersets.push(s2)
//         }
//     })
//     return {
//         same: same,
//         subsets: subsets,
//         supersets: supersets
//     }
// }

function scaleLink(s, name) {
    var link = document.createElement('a')
    link.onclick = function () {
        loadScale(s)
    }
    link.appendChild(document.createTextNode(name || s))
}

function updateScalenum(s, scaledict) {
    document.getElementById('scalenum').innerHTML = s

    // var similars = similarScales(s, scaledict
}

function clearKeys(keys) {
    keys.forEach(function (k) {
        if (k.checkbox.checked) {
            k.checkbox.onclick()
            k.checkbox.checked = false
        }
    })
}

// var loadScale

window.onload = function() {
    var scale = 0,
        piano = document.getElementById('piano'),
        keys = makeKeys(piano, function(n) {
            scale ^= 1 << n
            updateScalenum(scale)
        })

    // loadScale = function (s) {
    //     clearKeys(keys)
    //     for(var i = 0; i < 12; i++) {
    //         if (s & (1 << i)) {
    //             k.checkbox.onclick()
    //             k.checkbox.checked = true
    //         }
    //     }
    //     updateScalenum(scale)
    // }

    document.getElementById('clear').onclick = function() { clearKeys(keys) }

    updateScalenum(scale)

    document.addEventListener('keyup', function (e) {
        if (e.keyCode == 67) { // c
            clearKeys(keys)
        }
    })
}
