(function () {
    function playNext(notes, s, i) {
        return function () {
            if (i >= 12) {
                notes[12].play()
            } else if ((s >> i) & 1) {
                notes[i].onended = playNext(notes, s, i+1)
                notes[i].play()
            } else {
                playNext(notes, s, i+1)()
            }
        }
    }

    function startPlaying(notes, s) {
        playNext(notes, s, 0)()
    }

    var noteElements = false

    function getNotes() {
        if (!noteElements) {
            noteElements = []
            for(var i = 0; i < 13; i++) {
                noteElements.push(document.getElementById('note' + i))
            }
        }
        return noteElements
    }

    var playing = false

    playScale = function(s) {
        startPlaying(getNotes(), s)
    }
})()
