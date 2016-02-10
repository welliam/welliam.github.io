(function () {
    var wasSetup = false, notes = []

    function setup() {
        if (!wasSetup) {
            for(var i = 0; i < 13; i++) {
                var a = new Audio()
                a.src = 'resources/' + i + '.ogg'
                a.type = 'audio/ogg'
                notes.push(a)
            }
            wasSetup = true
        }
    }

    function stop() {
        setup()
        notes.forEach(function(a) {
            a.pause()
            a.currentTime = 0
        })
    }

    function note(i, next) {
        next = next || function() {}
        notes[i].onended = next
        notes[i].play()
    }

    function play(s, i) {
        stop() // calls setup

        if (i == 12) {
            note(i)
        } else if ((s >> i) & 1) {
            note(i, function() {
                play(s, i+1)
            })
        } else {
            play(s, i+1)
        }
    }

    PIANO.playScale = function(s) {
        play(s, 0)
    }

    PIANO.stopPlayScale = stop
})()
