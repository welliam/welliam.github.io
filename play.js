(function () {
    var audio = new Audio()

    function play(s, i) {
        if (i == 12) {
            audio.src = 'resources/12.ogg'
            audio.onended = function() {
            }
            audio.play()
        } else if ((s >> i) & 1) {
            audio.src = 'resources/' + i + '.ogg'
            audio.onended = function() {
                play(s, i+1)
            }
            audio.play()
        } else {
            play(s, i+1)
        }
    }

    playScale = function(s) {
        play(s, 0)
    }

    stopPlayScale = function() {
        audio.src = ''
    }
})()
