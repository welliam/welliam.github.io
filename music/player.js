(function () {
    function generateFromLink(element, player) {
        var link = element.getAttribute('href');
        if (link) {
            element.onclick = function (event) {
                player.src = link;
                player.currentTime = 0;
                player.play();
                element.setAttribute('href', 'javascript:;');
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

        player.onended = function () {
        };
        
        for(var i in elements) {
            if ((typeof elements[i]) == 'object') {
                generateFromLink(elements[i], player);
            }
        }

        makePlayerButton('playbutton', player, function () {
            player.play();
        });

        makePlayerButton('pausebutton', player, function () {
            player.pause();
        });

        makePlayerButton('stopbutton', player, function () {
            player.pause();
            player.currentTime = 0;
        });
    }
})();
