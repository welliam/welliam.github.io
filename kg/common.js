function format_stats(name, info, stats) {
    res = "<h4>" + name + "</h4><p>" + info + '</p><div class="stats">'
    for(var i in stats) {
        res += stats[i] + "<br />"
    }
    return res + "</div>"
}

function person(name, info, stats) {
    document.getElementById(name).onclick = function() {
        document.getElementById("chara").innerHTML = 
            format_stats(name, info, stats)
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
