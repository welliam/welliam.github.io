(function () {
    function generateFromLink(element, player) {
        var link = element.getAttribute('href');
        if (link) {
            element.onclick = function (event) {
                player.src = link;
                player.currentTime = 0;
                player.pause();
                playerPause(player, document.getElementById('playbutton'));

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
        var elem = document.getElementById(id);
        elem.onclick = function () {
            if (player.src) {
                action(elem);
            }
        };
    }

    function playerPause(player, elem) {
        if (player.paused) {
            player.play();
            elem.setAttribute('value', 'pause');
        } else {
            player.pause();
            elem.setAttribute('value', 'play');
        }
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

        makePlayerButton('playbutton', player, function (elem) {
            playerPause(player, elem);
        });

        makePlayerButton('stopbutton', player, function () {
            if (!player.paused) {
                playerPause(player, document.getElementById('playbutton'));
            }

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
