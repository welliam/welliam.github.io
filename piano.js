"use strict";

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

function areModes(s1, s2) {
    if (s1 == s2) {
        return false
    }
    for(var i = 0; i < 12; i++) {
        if (s1 == s2) {
            return true
        }
        if (s1 % 2) {
            s1 += 4096
        }
        s1 >>= 1
    }
    return false
}

function hammingDistance(s1notes, s2notes) {
    var sum = 0
    for(s1notes ^= s2notes; s1notes > 0; s1notes >>= 1) {
        sum += s1notes & 1
    }
    return sum
}

function sortScales(notes, scales) {
    return scales.sort(function (s1, s2) {
        var hd1 = hammingDistance(notes, s1.notes),
            hd2 = hammingDistance(notes, s2.notes)
        return hd1 == hd2 ? s1.notes > s2.notes : hd1 > hd2
    })
}

function similarScales(s1notes, scales) {
    var subsets = [],
        supersets = [],
        same = [],
        modes = []
    scales.forEach(function (s2) {
        var s2notes = s2.notes
        if (areModes(s1notes, s2notes)) {
            modes.push(s2)
        }

        if (s1notes == s2notes) {
            same.push(s2)
        } else if ((s1notes & s2notes) == s1notes) {
            supersets.push(s2)
        } else if ((s1notes & s2notes) == s2notes) {
            subsets.push(s2)
        }
    })

    return {
        same: sortScales(s1notes, same),
        subsets: sortScales(s1notes, subsets),
        supersets: sortScales(s1notes, supersets),
        modes: sortScales(s1notes, modes)
    }
}

function scaleLink(name, s) {
    var link = document.createElement('a')
    link.setAttribute('href', '#')
    link.onclick = function () {
        loadScale(s)
        document.getElementById('title').value = name
    }
    link.appendChild(document.createTextNode(name || s))
    return link
}

function resetScales(parent, list, scales) {
    if (!scales.length) {
        parent.style.display = 'none'
    } else {
        parent.style.display = 'block'
        list.innerHTML = ''
        scales.forEach(function (s) {
            var li = document.createElement('li')
            li.appendChild(scaleLink(s.name, s.notes))
            list.appendChild(li)
        })
    }
}

function statsTell(statistic) {
    var li = document.createElement('li')
    li.innerHTML = statistic
    document.getElementById('statslist').appendChild(li)
}

function isMolt(s) {
    if (!s % 2) {
        return false
    }

    return s % 64 == s >> 6 ||
        (s % 16 == (s >> 4) % 16 && s % 16 == s >> 8)
}

function isSymmetrical(s) {
    if (!s % 2) {
        return false
    }
    s >>= 1
    var rev = 0
    for(var i = 0; i < 11; i++) {
        rev *= 2
        rev += (s >> i) % 2
    }
    return rev == s
}

function tellAllStats(s) {
    if (isSymmetrical(s)) {
        statsTell('This scale is symmetrical.')
    }

    if (isMolt(s)) {
        statsTell('This scale is a mode of limited transposition.')
    }
}

function updateScalenum(s, scaledict) {
    document.getElementById('scalenum').value = s

    document.getElementById('statslist').innerHTML = ''
    tellAllStats(s)

    var similars = similarScales(s, scaledict)
    resetScales(document.getElementById('same'),
                document.getElementById('samelist'),
                similars.same)

    resetScales(
        document.getElementById('modes'),
        document.getElementById('modeslist'),
        similars.modes)

    resetScales(
        document.getElementById('subset'),
        document.getElementById('subsetlist'),
        similars.subsets)

    resetScales(
        document.getElementById('superset'),
        document.getElementById('supersetlist'),
        similars.supersets)
}


function clearKeys(keys) {
    keys.forEach(function (k) {
        if (k.checkbox.checked) {
            k.checkbox.onclick()
            k.checkbox.checked = false
        }
    })
}

function loadScale(s) {
    clearKeys(keys)
    keys.forEach(function (k) {
        if (s & (1 << k.nth)) {
            k.checkbox.onclick()
            k.checkbox.checked = true
        }
    })
    updateScalenum(s, scalesDictionary)
}

var keys

window.onload = function() {
    var scale = 0,
        piano = document.getElementById('piano')

    keys = makeKeys(piano, function(n) {
        scale ^= 1 << n
        updateScalenum(scale, scalesDictionary)
    })

    var scalenum = document.getElementById('scalenum')

    scalenum.onchange = function() {
        var attempt = parseInt(scalenum.value)
        if (attempt != NaN && attempt >= 0 && attempt < 4096) {
            loadScale(attempt)
        } else {
            clearKeys(keys)
        }
    }

    document.getElementById('clear').onclick = function() {
        document.getElementById('title').value = ''
        clearKeys(keys)
    }

    updateScalenum(scale, scalesDictionary)

    /* removed for now-- typing c in input type="text" activates this
    document.addEventListener('keydown', function (e) {
        if (e.key == 67) { // c
            clearKeys(keys)
        }
    })
    */

    document.getElementById('play').onclick = function() {
        playScale(scale)
    }

    document.getElementById('stop').onclick = function() {
        stopPlayScale()
    }

    document.getElementById('aboutlink').onclick = function() {
        document.getElementById('aboutsection').style.display = 'block'
    }

    document.getElementById('closeaboutlink').onclick = function() {
        document.getElementById('aboutsection').style.display = 'none'
    }
}
