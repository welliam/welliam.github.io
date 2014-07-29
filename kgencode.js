//----- TMOL ENCODING
function triangles(limit)
{
    var i = 0,
        prev = 0,
        it = 0,
        result = [];
    while (it < limit)
    {
        result.push(it);
        prev = it;
        it += i;
        i++;
    }
    result.splice(0,1);
    result.push(it);
    return result;
}

function mapSub1Cdr(a)
{
    a.splice(0,1);
    return a.map(function (x) {return x-1})
}

function encodeLine(numbers, str)
{
    if (numbers.length == 0)
        return "";
    else if (numbers[0] < str.length)
        return str[numbers[0]] + encodeLine(numbers.slice(1), str);
    else
        return encodeLine(numbers.slice(1), str);
}

function kgEncode(str)
{
    var start = mapSub1Cdr(triangles(str.length)),
        s     = str.replace(" ", "_", "g"),
        help  = function (line)
        {
            if (line.length == 0)
                return "";
            else
                return encodeLine(line, s) + " " +
                help(mapSub1Cdr(line));
        };
    return help(start);
}

//----- TMOL DECODING
function stringReverse(s)
{
    return s.split("").reverse().join("");
}

function partitionEncoding(str)
{
    return str
        .split(" ")
        .map(function (s) {return s.replace("_", " ", "g")})
}

function revDiagonal(a, index)
{
    var result = "";
    for(var i = 0; i < a.length; i++, index--)
    {
        if (index<0) break;
        else if (index < a[i].length)
            result += a[i][index];
    }
    return stringReverse(result);
}

function kgDecode(str)
{
    var i = 0,
        result = "",
        s = partitionEncoding(str);
    while(true)
    {
        var toAdd = revDiagonal(s, i);
        if (toAdd == "") break;
        result += toAdd;
        i++;
    }
    return result;
}

//----- SODA ENCODING/DECODING
function isConsonant(c)
{
    var consonants = "BCDFGHJKLMNPQRSTVWXYZbcdfghjklmnpqrstvwxyz".split("");
    return consonants.indexOf(c) != -1;
}

function doSoda(isEncoding) 
/* Decoding and encoding are so similar that it makes more sense to wrap them 
 * in a parent function which I've called doSoda. 
*/
{
    return function(str)
    {
        var result = "",
            vowels = {'A':1, 'E':2, 'I':3, 'O':4, 'U':5,
                      'a':1, 'e':2, 'i':3, 'o':4, 'u':5},
            numbers = {1:'A', 2:'E', 3:'I', 4:'O', 5:'U'};
        for(var i = 0; i < str.length; i++)
        {
            var c      = str[i],
                lookup = isEncoding ? vowels[c] : numbers[c];
            if (lookup)
                result += lookup;
            else if (isConsonant(c))
            {
                if (isEncoding)
                    result += (c + nextLetter(c));
                else
                    {
                        result += c;
                        i++; // skip next letter
                    }
            }
            else
                result += c;
        }
        return result.toUpperCase();
    }
}

var sodaEncode = doSoda(true)
var sodaDecode = doSoda(false)

function nextLetter(c)
{
    if (c == 'z')
        return 'a';
    else if (c == 'Z')
        return 'A'
    else
       return String.fromCharCode(c.charCodeAt(0) + 1)
}

//----- PAGE FUNCTIONS
function processInput(f)
{
    return function ()
    {
        var inp = f(document.getElementById("input").value);
        document.getElementById("output").value = inp;
    }
}

encodeText = processInput(kgEncode);
decodeText = processInput(kgDecode);
encodeSodaText = processInput(sodaEncode);
decodeSodaText = processInput(sodaDecode);
