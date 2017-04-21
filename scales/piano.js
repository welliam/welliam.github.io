PIANO = {}; // used for globally-visible functions


// scales

(function() {
  scales = {};

  function addScale(name, num) {
    scales[name] = num;
  }

  function defscale(name, notes) {
    addScale(name, parseInt(notes, 2));
  }

  // major and modes
  function revert() {
    defscale('Major', '101010110101'),
    defscale('Natural Minor', '010110101101'),
    defscale('Ionian', '101010110101'),
    defscale('Dorian', '011010101101'),
    defscale('Phrygian', '010110101011'),
    defscale('Lydian', '101011010101'),
    defscale('Mixolydian', '011010110101'),
    defscale('Aeolian', '010110101101'),
    defscale('Locrian', '010101101011'),

    // melodic minor and modes
    defscale('Melodic Minor', '101010101101'),
    defscale('Dorian b2', '011010101011'),
    defscale('Lydian #5', '101101010101'),
    defscale('Lydian Dominant', '011011010101'),
    defscale('Aeolian Dominant', '010110110101'),
    defscale('Half Diminished', '010101101101'),
    defscale('Altered', '010101011011'),

    defscale('Harmonic Minor', '100110101101'),

    // Named MOLTs
    defscale('Chromatic', '111111111111'),
    defscale('Augmented', '100110011001'),
    defscale('Tritone', '010011010011'),
    defscale('Whole Tone', '010101010101'),
    defscale('Diminished 1', '011011011011'),
    defscale('Diminished 2', '101101101101'),
    defscale('MOLT 3', '110111011101'),
    defscale('MOLT 4', '100111100111'),
    defscale('MOLT 5', '100011100011'),
    defscale('MOLT 6', '110011110011'),
    defscale('MOLT 7', '101111101111'),

    // Pentatonic scales and friends
    defscale('Major Pentatonic', '001010010101'),
    defscale('Minor Pentatonic', '010010101001'),
    defscale('Blues', '010011101001');
  }

  revert()

  function getAllScales() {
    var t = [];
    for(x in scales) {
      t.push({
        name: x,
        notes: scales[x]
      });
    }
    return t;
  }

  function removeScale(name) {
    scales[name] = null;
  }

  PIANO.scales = {
    add: addScale,
    get: getAllScales,
    remove: removeScale,
    revert: revert
  };
})();


// making the keyboard

(function() {
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
    return 25 * (nth + (nth > 4 ? 1 : 0));
  }

  var generateId = (function () {
    var x = 0;
    return function() {
      return '___' + (x++).toString() + '___';
    };
  })();

  function makeKey(nth, startx, starty) {
    startx = startx || 0;
    starty = starty || 0;

    var id = generateId(),
        span = document.createElement('span'),
        label = document.createElement('label'),
        checkbox = document.createElement('input'),
        position = keyPosition(nth),
        keyisblack = isBlack(nth);

    span.appendChild(checkbox);
    span.appendChild(label);

    checkbox.setAttribute('id', id);
    checkbox.setAttribute('type', 'checkbox');
    checkbox.setAttribute('class', 'keycheckbox');

    label.setAttribute('for', id);
    label.setAttribute(
      'class', 'key ' + (keyisblack ? 'blackkey' : 'whitekey')
    );
    label.style.top = starty + 'px';
    label.style.left = startx + position + (keyisblack ? 10 : 0) + 'px';
    label.style.zIndex = keyisblack ? '1' : '0';

    return {
      span: span,
      checkbox: checkbox,
      nth: nth
    };
  }

  function makeKeys(parent, listener) {
    var keys = [];
    for(var i = 0; i < 12; i++) {
      (function () {
        var key = makeKey(i);
        key.checkbox.onclick = function() {
          listener(key.nth);
        };
        keys.push(key);
        parent.appendChild(key.span);
      })();
    }
    return keys;
  }

  PIANO.makeKeys = makeKeys;
})();


// scale predicates

(function () {
  function hammingDistance(s1notes, s2notes) {
    var sum = 0;
    for(s1notes ^= s2notes; s1notes > 0; s1notes >>= 1) {
      sum += s1notes & 1;
    }
    return sum;
  }

  function areModes(s1, s2) {
    if (s1 == s2) {
      return false;
    }
    for(var i = 0; i < 12; i++) {
      if (s1 == s2) {
        return true;
      }
      if (s1 % 2) {
        s1 += 4096;
      }
      s1 >>= 1;
    }
    return false;
  }

  function sortScales(notes, scales) {
    return scales.sort(function (s1, s2) {
      var hd1 = hammingDistance(notes, s1.notes),
          hd2 = hammingDistance(notes, s2.notes);
      return hd1 == hd2 ? s1.notes > s2.notes : hd1 > hd2;
    });
  }

  function isMolt(s) {
    if (!s % 2) {
      return false;
    }

    return s % 64 == s >> 6 ||
      (s % 16 == (s >> 4) % 16 && s % 16 == s >> 8);
  }

  function isSymmetrical(s) {
    if (!s % 2) {
      return false;
    }
    s >>= 1;
    var rev = 0;
    for(var i = 0; i < 11; i++) {
      rev *= 2;
      rev += (s >> i) % 2;
    }
    return rev == s;
  }

  function similarScales(s1notes, scales) {
    var subsets = [],
        supersets = [],
        same = [],
        modes = [];
    scales.forEach(function (s2) {
      var s2notes = s2.notes;
      if (areModes(s1notes, s2notes)) {
        modes.push(s2);
      }

      if (s1notes == s2notes) {
        same.push(s2);
      } else if ((s1notes & s2notes) == s1notes) {
        supersets.push(s2);
      } else if ((s1notes & s2notes) == s2notes) {
        subsets.push(s2);
      }
    });

    return {
      same: sortScales(s1notes, same),
      subsets: sortScales(s1notes, subsets),
      supersets: sortScales(s1notes, supersets),
      modes: sortScales(s1notes, modes)
    };
  }

  PIANO.similarScales = similarScales;
  PIANO.isMolt = isMolt;
  PIANO.isSymmetrical = isSymmetrical;
})();


// playing notes

(function () {
  var context = new (window.AudioContext || window.webkitAudioContext)(),
      oscillator = context.createOscillator(),
      gain = context.createGain(),
      timeout;
  oscillator.connect(gain);
  gain.connect(context.destination);
  gain.gain.value = 0;
  oscillator.start()

  function noteFreq(i) {
    return 261.63 * ((2 ** (1/12)) ** i);
  }

  function stop() {
    gain.gain.value = 0;
    timeout && clearTimeout(timeout);
  }

  function note(i, next) {
    gain.gain.value = 1;
    next = next || function() { stop(); };
    oscillator.frequency.value = noteFreq(i);
    timeout = setTimeout(next, 500);
  }

  function play(s, i) {
    stop();

    if (i == 12) {
      note(i);
    } else if ((s >> i) & 1) {
      note(i, function() {
        play(s, i+1);
      });
    } else {
      play(s, i+1);
    }
  }

  PIANO.playScale = function(s) {
    play(s, 0);
  };

  PIANO.stopPlayScale = stop;
})();


// page altering functions

(function () {
  function makeLink(action) {
    var link = document.createElement('a')
    link.setAttribute('href', '#');
    link.onclick = action;
    return link;
  }

  function scaleLink(keys, name, s) {
    var span = document.createElement('span');
    var setLink = makeLink(function () {
      loadScale(keys, s);
      document.getElementById('title').value = name;
    });

    setLink.appendChild(document.createTextNode(name || s));
    span.appendChild(setLink)
    return span;
  }

  function refreshScales(keys, parent, list, scales) {
    if (!scales.length) {
      parent.style.display = 'none';
    } else {
      parent.style.display = 'block';
      list.innerHTML = '';
      scales.forEach(function (s) {
        var li = document.createElement('li');
        li.appendChild(scaleLink(keys, s.name, s.notes));
        list.appendChild(li);
      });
    }
  }

  function refreshAllScales(keys, scale, dict) {
    var similars = PIANO.similarScales(scale, dict);

    refreshScales(keys,
                  document.getElementById('same'),
                  document.getElementById('samelist'),
                  similars.same);

    refreshScales(keys,
                  document.getElementById('modes'),
                  document.getElementById('modeslist'),
                  similars.modes);

    refreshScales(keys,
                  document.getElementById('subset'),
                  document.getElementById('subsetlist'),
                  similars.subsets);

    refreshScales(keys,
                  document.getElementById('superset'),
                  document.getElementById('supersetlist'),
                  similars.supersets);
  }

  function statsTell(statistic) {
    var li = document.createElement('li');
    li.innerHTML = statistic;
    document.getElementById('statslist').appendChild(li);
  }

  function tellAllStats(scale) {
    if (PIANO.isSymmetrical(scale)) {
      statsTell('This scale is symmetrical.');
    }

    if (PIANO.isMolt(scale)) {
      statsTell('This scale is a mode of limited transposition.');
    }
  }

  function updateScalenum(keys, scale) {
    document.getElementById('scalenum').value = scale;
    document.getElementById('statslist').innerHTML = '';
    tellAllStats(scale);
    refreshAllScales(keys, scale, PIANO.scales.get());
  }

  function clearKeys(keys) {
    keys.forEach(function (k) {
      if (k.checkbox.checked) {
        k.checkbox.onclick();
        k.checkbox.checked = false;
      }
    });
  }

  function clearScale(keys) {
    document.getElementById('title').value = '';
    clearKeys(keys);
  }

  function loadScale(keys, scale) {
    clearKeys(keys);
    keys.forEach(function (k) {
      if (scale & (1 << k.nth)) {
        k.checkbox.onclick();
        k.checkbox.checked = true;
      }
    });
    updateScalenum(keys, scale);
  }

  function addHotkey(key, action) {
    document.addEventListener('keydown', function (e) {
      var element = document.activeElement;
      var type =
          element.hasAttribute('type') && element.getAttribute('type');
      if (type != 'text' && e.key == key) {
        action();
      }
    });
  }

  function addScale(keys, scale) {
    var title = document.getElementById('title').value
    if (title) {
      PIANO.scales.add(title, scale);
      refreshAllScales(keys, scale, PIANO.scales.get());
    }
  }

  function inputOnEnter(input, action) {
    input.onkeydown = function (event) {
      if (event.keyCode == 13) {
        action();
      }
    }
  }

  window.onload = function() {
    var scale = 0;
    var piano = document.getElementById('piano');

    var keys = PIANO.makeKeys(piano, function(n) {
      scale ^= 1 << n;
      updateScalenum(keys, scale);
    })


    updateScalenum(keys, scale);

    var scalenum = document.getElementById('scalenum');
    scalenum.onchange = function (event) {
      scalenum.value = scale;
    }

    inputOnEnter(scalenum, function () {
      var attempt = parseInt(scalenum.value);
      if (attempt != NaN && attempt >= 0 && attempt < 4096) {
        loadScale(keys, attempt);
      } else {
        clearKeys(keys);
      }
    });

    inputOnEnter(document.getElementById('title'), function () {
      addScale(keys, scale);
    });

    document.getElementById('clear').onclick = function() {
      clearScale(keys);
    }

    document.getElementById('play').onclick = function() {
      PIANO.playScale(scale);
    };

    document.getElementById('stop').onclick = PIANO.stopPlayScale;

    document.getElementById('aboutlink').onclick = function () {
      document.getElementById('aboutsection').style.display = 'block';
    };

    document.getElementById('closeaboutlink').onclick = function () {
      document.getElementById('aboutsection').style.display = 'none';
    };

    document.getElementById('add').onclick = function () {
      addScale(keys, scale);
    };

    addHotkey('p', function() {
      PIANO.playScale(scale);
    });

    addHotkey('s', PIANO.stopPlayScale);

    addHotkey('?', function () {
      var newDisplay;
      var style = document.getElementById('aboutsection').style;
      if (style.display && style.display == 'block') {
        newDisplay = 'none';
      } else {
        newDisplay = 'block';
      }
      style.display = newDisplay;
    });

    var maybeScale = parseInt(window.location.hash.substring(1));
    console.log(maybeScale);
    if (maybeScale) {
      loadScale(keys, maybeScale);
    }
  }
})();
