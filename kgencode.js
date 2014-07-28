//----- ENCODING

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

//----- DECODING
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

//----- SODA
function sodaEncode(str)
{
    var encoded = "",
        vowels = {'a':1, 'e':2, 'i':3, 'o':4, 'u':5,
                  'A':1, 'E':2, 'I':3, 'O':4, 'U':5}
        consonants = "BCDFGHJKLMNPQRSTVWXYZbcdfghjklmnpqrstvwxyz".split("");
    for (i in str)
    {
        var c = str[i],
            lookup = vowels[c];
        if (lookup)
            encoded += lookup;
        else if (consonants.indexOf(c) != -1)
            encoded += (c + nextLetter(c));
        else
            encoded += c;
    }
    return encoded;
}

function nextLetter(c)
{
    if (c == 'z')
        return 'a';
    else if (c == 'Z')
        return 'A'
    else
       return String.fromCharCode(c.charCodeAt(0) + 1)
}

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
encodeSoda = processInput(sodaEncode);
