function person(name, info, stats) {
    document.getElementById(name).onclick = function() {
        document.getElementById("chara").innerHTML =
            "<h4>" + name + "</h4><p>" + info + "</p><p>" + stats + "</p>"
    }
}

function persons() {
    var args = arguments // not window.onload's arguments
    window.onload = function() {
        for(var i in args) {
            var n = args[i]
            person(n[0], n[1], n[2])
        }
    }
}
