(function() {
    function defscale(name, notes) {
        return {
            name: name,
            notes: parseInt(notes, 2)
        }
    }

    var scales = [
        // major and modes
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
        defscale('Blues', '010011101001')
    ]

    PIANO.scalesDictionary = scales
})()
