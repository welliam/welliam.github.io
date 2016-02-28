(function () {
    function generateFromLink(element, player) {
        var link = element.getAttribute('href');
        if (link) {
            element.onclick = function (event) {
                player.src = link;
                player.currentTime = 0;
                player.play();
                element.setAttribute('href', 'javascript:;');

                document.getElementById('track').innerHTML =
                    element.innerHTML + ':';
            };
        } else {
            console.log(
                "element given to generateFromLink doesn't have href"
            );
        }
    }

    function makePlayerButton(id, player, action) {
        document.getElementById(id).onclick = function () {
            if (player.src) {
                action();
            }
        };
    }
    
    window.onload = function () {
        var player = new Audio();
        var elements = document.getElementsByClassName('musiclink')

        for(var i in elements) {
            if ((typeof elements[i]) == 'object') {
                generateFromLink(elements[i], player);
            }
        }

        var timespan = document.getElementById('time'), time;

        makePlayerButton('playbutton', player, function () {
            player.play();
        });

        makePlayerButton('pausebutton', player, function () {
            player.pause();
        });

        makePlayerButton('stopbutton', player, function () {
            player.pause();
            player.currentTime = 0;
            timespan.innerHTML = '0:00';
        });

        setInterval(function () {
            if (! player.paused) {
                time = player.currentTime;
                timespan.innerHTML = parseInt(time / 60) +
                    ':' +
                    (time % 60 < 10 ? '0' : '') +
                    parseInt(time % 60);
            }
        }, 1000);
    }
})();
