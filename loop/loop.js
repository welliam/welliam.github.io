(function () {
    var audio, interval, loopLength = 8.850;

    function fadeOut(element) {
        var op = 1;

        if (element.___fader) {
            clearInterval(element.___fader);
        }

        element.style.display = 'inline';

        element.___fader = setInterval(function () {
            op -= 0.0035;
            element.style.opacity = op;
            if (op <= 0) { 
                op = 1;
                element.style.display = 'none';
                clearInterval(element.___fader);
            }
        }, 5);
    }

    function fadeOutInfo(infoid, info) {
        var infoelement = document.getElementById(infoid);
        infoelement.innerHTML = info;
        fadeOut(infoelement);
    }

    function createMusicLoop(src, loopAfter, _loopLength) {
        audio = new Audio();
        audio.src = src;
        audio.type = 'audio/ogg';

        loopLength = _loopLength;

        setLoopInterval(500, loopAfter, loopLength);
        audio.play();
    }

    function makeIntervalCallback(loopAfter) {
        var i = 0;
        return function () {
            if (audio.currentTime > loopAfter) {
                audio.currentTime -= loopLength;
                var loopcount = document.getElementById('loopcount');
                loopcount.appendChild(
                        document.createTextNode('looped! ' + ++i + '\n')
                );
                loopcount.scrollTop = loopcount.scrollHeight;
            }
            document.getElementById('time').innerHTML = audio.currentTime;
        }
    }

    var setLoopInterval, setLoopIntervalTime;

    (function () {
        var currentCallback;

        setLoopInterval = function (time, loopAfter, loopLength) {
            clearInterval(interval);
            currentCallback = makeIntervalCallback(loopAfter, loopLength);
            interval = setInterval(currentCallback, time);
        }

        setLoopIntervalTime = function(time) {
            clearInterval(interval);
            interval = setInterval(currentCallback, time);
        }
    })();

    function restart() {
        audio.pause();
        audio.currentTime = 0;
        audio.play();
    }

    function inputHandler(inputId, parse, action) {
        return function () {
            var x = parse(
                document.getElementById(inputId).value
            );

            if (x && x != NaN) {
                action(x);
            }
        }
    }

    var submitJumpBackOnLoop =
        inputHandler('jumpbackinput', parseFloat, function (x) {
            loopLength = x;
            fadeOutInfo('jumpbackinfo',
                        'will jump back ' + x
                        + ' second' + (x == 1 ? '' : 's') + ' on loop');
        });

    var skipAhead = inputHandler('skipaheadinput', parseFloat, function (x) {
        audio.currentTime += x;
        fadeOutInfo('skipaheadinfo',
                    'went forward by ' + x
                    + ' second' + (x == 1 ? '' : 's'));
    });
    
    var submitSetInterval =
        inputHandler('intervalcheckinput', parseInt, function (x) {
            setLoopIntervalTime(x);
            fadeOutInfo('intervalcheckinfo',
                        'checks for loop every ' + x
                        + ' millisecond' + (x == 1 ? '' : 's'));
        });

    window.onload = function() {
        createMusicLoop("islandbirdie.ogg", 17.792, 8.850);
        document.getElementById('jumpbackbutton').onclick =
            submitJumpBackOnLoop;
        document.getElementById('skipaheadbutton').onclick = skipAhead;
        document.getElementById('intervalcheckbutton').onclick =
            submitSetInterval;
        document.getElementById('restartbutton').onclick = restart;
    };
})();
